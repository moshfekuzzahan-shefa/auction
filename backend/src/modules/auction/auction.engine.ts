import prisma from '../../config/db';
import logger from '../../utils/logger';
import { Server, Socket } from 'socket.io';
import { AuditService } from '../../services/audit.service';
import { Prisma } from '@prisma/client';

type AuctionMode = 'NORMAL' | 'BLIND';
type AuctionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

interface Bid {
  teamId: string;
  amount: number;
  timestamp: Date;
}

export class AuctionEngine {
  private io: Server;
  
  // Singleton State
  private status: AuctionStatus = 'IDLE';
  private mode: AuctionMode = 'NORMAL';
  private currentPlayerId: string | null = null;
  private currentBid: number = 0;
  private currentLeaderId: string | null = null;
  private timer: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private blindBids: Map<string, number> = new Map();

  // Serialized Queue to prevent double spending / race conditions
  private bidQueue: Promise<void> = Promise.resolve();

  constructor(io: Server) {
    this.io = io;
  }

  // Helper for Queueing
  private enqueue(task: () => Promise<void>) {
    this.bidQueue = this.bidQueue.then(() => task().catch(err => { logger.error('Bid queue error:', err); }));
  }

  // --- Admin Controls ---

  public async startAuction(playerId: string, mode: AuctionMode = 'NORMAL', basePrice: number = 100, timerSeconds: number = 30) {
    if (this.status !== 'IDLE') throw new Error('Auction already active');
    
    this.status = 'ACTIVE';
    this.mode = mode;
    this.currentPlayerId = playerId;
    this.currentBid = basePrice;
    this.currentLeaderId = null;
    this.timer = timerSeconds;
    this.blindBids.clear();

    this.broadcastState();
    this.startTimer();
  }

  public pause() {
    if (this.status === 'ACTIVE') {
      this.status = 'PAUSED';
      this.stopTimer();
      this.broadcastState();
    }
  }

  public resume() {
    if (this.status === 'PAUSED') {
      this.status = 'ACTIVE';
      this.startTimer();
      this.broadcastState();
    }
  }

  public cancel() {
    this.stopTimer();
    this.status = 'IDLE';
    
    AuditService.log({
      action: 'AUCTION_CANCELLED',
      resource: 'AuctionEngine',
      metadata: { playerId: this.currentPlayerId }
    });

    this.currentPlayerId = null;
    this.broadcastState();
  }

  public async rollback(ledgerId: string) {
    // Admin override to cancel a sold player
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.auctionLedger.findUnique({ where: { id: ledgerId } });
      if (!ledger || ledger.status !== 'SOLD') throw new Error('Invalid ledger for rollback');
      
      await tx.auctionLedger.update({ where: { id: ledgerId }, data: { status: 'ROLLBACK' } });
      
      const team = await tx.team.findUnique({ where: { id: ledger.teamId } });
      if (team) {
        await tx.team.update({ where: { id: team.id }, data: { budget: team.budget + ledger.amount } });
      }

      await tx.profile.update({
        where: { userId: ledger.playerId },
        data: { isSold: false, soldPrice: null, teamId: null }
      });
      
      await AuditService.log({
        action: 'AUCTION_ROLLBACK',
        resource: 'AuctionEngine',
        metadata: { ledgerId, playerId: ledger.playerId, teamId: ledger.teamId }
      });
    });
  }

  public toggleBidMode(mode: AuctionMode) {
    if (this.status === 'IDLE') {
      this.mode = mode;
      this.broadcastState();
    }
  }

  // --- Core Bidding Math & Guardrails ---

  private async validateBidEligibility(tx: Prisma.TransactionClient, teamId: string, proposedBid: number): Promise<{ isValid: boolean, error?: string }> {
    // We use Prisma raw query for strict row locking inside the transaction
    const teamRaw = await tx.$queryRaw<any[]>`SELECT * FROM "Team" WHERE id = ${teamId} FOR UPDATE`;
    const team = teamRaw[0];

    const system = await tx.systemState.findFirst();
    const categories = await tx.playerCategory.findMany({ orderBy: { basePrice: 'asc' } });
    
    // Using Prisma to count players since it's outside the Team row lock
    const currentPlayersCount = await tx.profile.count({ where: { teamId } });
    
    if (!team || !system || categories.length === 0) return { isValid: false, error: 'System not fully configured' };

    const minRoster = system.minRoster;
    
    if (currentPlayersCount + 1 >= minRoster) {
       if (team.budget < proposedBid) return { isValid: false, error: 'Insufficient budget' };
       return { isValid: true };
    }

    const lowestBasePrice = categories[0].basePrice;
    const remainingPlayersNeeded = minRoster - (currentPlayersCount + 1);
    const requiredReserve = remainingPlayersNeeded * lowestBasePrice;
    
    const availableToSpend = team.budget - requiredReserve;
    if (availableToSpend < proposedBid) {
      return { isValid: false, error: `Reserve constraint breached. Need to keep $${requiredReserve} for ${remainingPlayersNeeded} remaining players.` };
    }
    return { isValid: true };
  }

  // --- Real-Time Bidding ---

  public placeBid(teamId: string, amount: number) {
    if (this.status !== 'ACTIVE') return;

    this.enqueue(async () => {
      // Dynamic Bid Math
      const system = await prisma.systemState.findFirst();
      if (!system) return;

      if (this.mode === 'NORMAL') {
        if (amount <= this.currentBid) {
          this.io.to(`team_${teamId}`).emit('ERROR', 'Bid must be higher than current bid');
          return;
        }
        
        const { nextValidBid, minimumRaise } = await this.calculateNextBid();

        if (amount < nextValidBid) {
           this.io.to(`team_${teamId}`).emit('ERROR', `Bid increment too low. Next valid bid must be at least $${nextValidBid}`);
           return;
        }

        // We wrap the validation in a transaction to enforce the FOR UPDATE lock
        await prisma.$transaction(async (tx) => {
          const { isValid, error } = await this.validateBidEligibility(tx, teamId, amount);
          if (!isValid) {
            this.io.to(`team_${teamId}`).emit('ERROR', `Bid rejected: ${error}`);
            return;
          }

          // Apply bid
          this.currentBid = amount;
          this.currentLeaderId = teamId;
          
          // Reset timer
          this.timer = 30; // Reset to 30s
          
          this.io.emit('BID_PLACED', { teamId, amount });
          this.broadcastState();
        });

      } else if (this.mode === 'BLIND') {
        await prisma.$transaction(async (tx) => {
          const { isValid, error } = await this.validateBidEligibility(tx, teamId, amount);
          if (!isValid) {
             this.io.to(`team_${teamId}`).emit('ERROR', `Bid rejected: ${error}`);
             return;
          }
          this.blindBids.set(teamId, amount);
          this.io.to(`team_${teamId}`).emit('SUCCESS', 'Blind bid registered');
        });
      }
    });
  }

  // --- Internal Engine Logic ---

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(async () => {
      if (this.timer > 0) {
        this.timer--;
        this.io.emit('TIMER_TICK', { timer: this.timer });
      } else {
        await this.endAuction();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private async endAuction() {
    this.stopTimer();
    this.status = 'IDLE';

    this.enqueue(async () => {
      let winnerId: string | null = null;
      let finalAmount: number = 0;

      if (this.mode === 'NORMAL') {
        winnerId = this.currentLeaderId;
        finalAmount = this.currentBid;
      } else {
        // Find highest blind bid
        let maxBid = 0;
        for (const [tId, amt] of this.blindBids.entries()) {
          if (amt > maxBid) {
            maxBid = amt;
            winnerId = tId;
          }
        }
        finalAmount = maxBid;
      }

      if (winnerId && this.currentPlayerId) {
        // Persist to DB (Transactions)
        await prisma.$transaction(async (tx) => {
          // Lock team row
          const teamRaw = await tx.$queryRaw<any[]>`SELECT * FROM "Team" WHERE id = ${winnerId!} FOR UPDATE`;
          const team = teamRaw[0];

          if (team) {
            // Re-verify eligibility before final deduction (crucial for blind bids or delayed queues)
            const { isValid, error } = await this.validateBidEligibility(tx, winnerId!, finalAmount);
            if (!isValid) {
              throw new Error(`Winner ${winnerId} mathematically disqualified at T=0: ${error}`);
            }

            await tx.team.update({
              where: { id: winnerId! },
              data: { budget: team.budget - finalAmount }
            });
          }
          
          // Update player
          await tx.profile.update({
            where: { userId: this.currentPlayerId! },
            data: { isSold: true, soldPrice: finalAmount, teamId: winnerId }
          });

          // Write ledger
          await tx.auctionLedger.create({
            data: {
              playerId: this.currentPlayerId!,
              teamId: winnerId!,
              amount: finalAmount,
              isBlind: this.mode === 'BLIND',
              status: 'SOLD'
            }
          });
        });
        this.io.emit('PLAYER_SOLD', { winnerId, finalAmount, playerId: this.currentPlayerId });
      } else {
        this.io.emit('PLAYER_UNSOLD', { result: 'UNSOLD', playerId: this.currentPlayerId });
      }
    });
  }

  public async calculateNextBid(): Promise<{ minimumRaise: number, nextValidBid: number }> {
    const system = await prisma.systemState.findFirst();
    if (!system || this.status !== 'ACTIVE') return { minimumRaise: 0, nextValidBid: this.currentBid };

    const budgetPercent = (this.currentBid / system.totalBudget);
    const rules = await prisma.bidRaiseRule.findMany({ orderBy: { minBudgetPercent: 'desc' } });
    
    let requiredRaisePercent = 0.001; // default fallback 0.1%
    for (const rule of rules) {
      if (budgetPercent >= rule.minBudgetPercent) {
        requiredRaisePercent = rule.raisePercent;
        break;
      }
    }
    const minimumRaise = Math.max(10, Math.floor(system.totalBudget * requiredRaisePercent));
    return { minimumRaise, nextValidBid: this.currentBid + minimumRaise };
  }

  public async broadcastState(targetSocket?: Socket) {
    const { minimumRaise, nextValidBid } = await this.calculateNextBid();

    let currentPlayer = null;
    if (this.currentPlayerId) {
      currentPlayer = await prisma.profile.findUnique({
        where: { userId: this.currentPlayerId },
        include: { user: true, category: true }
      });
    }

    const payload = {
      status: this.status,
      mode: this.mode,
      currentPlayerId: this.currentPlayerId,
      currentPlayer,
      currentBid: this.currentBid,
      currentLeaderId: this.currentLeaderId,
      timer: this.timer,
      nextValidBid,
      minimumRaise
    };

    if (targetSocket) {
      targetSocket.emit('AUCTION_STATE', payload);
    } else {
      this.io.emit('AUCTION_STATE', payload);
    }
  }
}
