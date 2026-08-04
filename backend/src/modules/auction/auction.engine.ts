import prisma from '../../config/db';
import logger from '../../utils/logger';
import { Server, Socket } from 'socket.io';
import { AuditService } from '../../services/audit.service';
import { Prisma } from '@prisma/client';

type AuctionMode = 'NORMAL' | 'BLIND';
type AuctionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

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

  public async startAuction(playerId: string, mode: AuctionMode = 'NORMAL', basePriceOverride?: number, timerSeconds: number = 30) {
    if (this.status !== 'IDLE') throw new Error('Auction already active');
    
    // Fetch player profile & category basePrice cleanly supporting both userId and profile id
    const player = await prisma.profile.findFirst({
      where: {
        OR: [
          { userId: playerId },
          { id: playerId }
        ]
      },
      include: { category: true }
    });

    if (!player) {
      throw new Error('Player profile not found for podium auction');
    }

    const calculatedBasePrice = basePriceOverride || player.basePrice || player.category?.basePrice || 500;

    this.status = 'ACTIVE';
    this.mode = mode;
    this.currentPlayerId = player.userId;
    this.currentBid = calculatedBasePrice;
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

    this.broadcastState();
  }

  public extendTimer(seconds: number = 10) {
    if (this.status === 'ACTIVE' || this.status === 'PAUSED') {
      this.timer += seconds;
      this.io.emit('TIMER_TICK', { timer: this.timer });
      this.io.emit('TIMER_EXTENDED', { addedSeconds: seconds, newTimer: this.timer });
      this.broadcastState();
    }
  }

  public toggleBidMode(mode: AuctionMode) {
    if (this.status === 'IDLE') {
      this.mode = mode;
      this.broadcastState();
    }
  }

  // --- Core Bidding Math & Guardrails ---

  private async validateBidEligibility(tx: Prisma.TransactionClient, teamId: string, proposedBid: number): Promise<{ isValid: boolean, error?: string, maxAllowableBid?: number }> {
    // Lock team row with SELECT ... FOR UPDATE inside transaction to prevent double spending
    const teamRaw = await tx.$queryRaw<any[]>`SELECT * FROM "Team" WHERE id = ${teamId} FOR UPDATE`;
    const team = teamRaw[0];

    const system = await tx.systemState.findFirst();
    const categories = await tx.playerCategory.findMany({ orderBy: { basePrice: 'asc' } });
    const currentPlayersCount = await tx.profile.count({ where: { teamId } });
    
    if (!team || !system) return { isValid: false, error: 'System not fully configured' };

    const minRoster = system.minRoster || 11;
    const lowestBasePrice = categories.length > 0 ? categories[0].basePrice : 250;
    
    // Remaining required slots after acquiring this player
    const remainingSlotsNeeded = Math.max(0, minRoster - (currentPlayersCount + 1));
    const requiredReserve = remainingSlotsNeeded * lowestBasePrice;
    
    const maxAllowableBid = team.budget - requiredReserve;
    
    if (proposedBid > maxAllowableBid) {
      return { 
        isValid: false, 
        maxAllowableBid,
        error: `Bid rejected! You must retain $${requiredReserve} reserve budget to fulfill the minimum roster size (${minRoster} players needed, currently have ${currentPlayersCount}). Maximum allowable bid is $${maxAllowableBid}.` 
      };
    }

    return { isValid: true, maxAllowableBid };
  }

  // --- Real-Time Bidding ---

  public placeBid(teamId: string, amount: number, senderSocket?: Socket) {
    if (this.status !== 'ACTIVE') {
      if (senderSocket) senderSocket.emit('ERROR', 'Auction is not active!');
      return;
    }

    this.enqueue(async () => {
      if (this.mode === 'NORMAL') {
        const { nextValidBid } = await this.calculateNextBid();

        if (this.currentLeaderId && amount < nextValidBid) {
          const errMsg = `Bid increment too low. Next valid bid must be at least $${nextValidBid.toLocaleString()}`;
          if (senderSocket) senderSocket.emit('ERROR', errMsg);
          this.io.to(`team_${teamId}`).emit('ERROR', errMsg);
          return;
        }

        // Validate eligibility inside transaction with row locking
        await prisma.$transaction(async (tx) => {
          const { isValid, error } = await this.validateBidEligibility(tx, teamId, amount);
          if (!isValid) {
            if (senderSocket) senderSocket.emit('ERROR', error);
            this.io.to(`team_${teamId}`).emit('ERROR', error);
            return;
          }

          // Apply bid
          this.currentBid = amount;
          this.currentLeaderId = teamId;
          
          // Reset timer on new valid bid
          this.timer = 30; // Reset to 30s
          
          this.io.emit('BID_PLACED', { teamId, amount });
          this.broadcastState();
        });

      } else if (this.mode === 'BLIND') {
        await prisma.$transaction(async (tx) => {
          const { isValid, error } = await this.validateBidEligibility(tx, teamId, amount);
          if (!isValid) {
            if (senderSocket) senderSocket.emit('ERROR', error);
            this.io.to(`team_${teamId}`).emit('ERROR', error);
            return;
          }
          this.blindBids.set(teamId, amount);
          if (senderSocket) senderSocket.emit('SUCCESS', 'Blind bid registered');
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

  public async endAuction() {
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
        // Persist to DB inside Transaction
        await prisma.$transaction(async (tx) => {
          const teamRaw = await tx.$queryRaw<any[]>`SELECT * FROM "Team" WHERE id = ${winnerId!} FOR UPDATE`;
          const team = teamRaw[0];

          if (team) {
            const { isValid, error } = await this.validateBidEligibility(tx, winnerId!, finalAmount);
            if (!isValid) {
              throw new Error(`Winner ${winnerId} mathematically disqualified at T=0: ${error}`);
            }

            await tx.team.update({
              where: { id: winnerId! },
              data: { budget: team.budget - finalAmount }
            });
          }
          
          // Update player as sold to this team
          await tx.profile.update({
            where: { userId: this.currentPlayerId! },
            data: { isSold: true, soldPrice: finalAmount, teamId: winnerId }
          });

          // Write ledger entry
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
      this.broadcastState();
    });
  }

  public async calculateNextBid(): Promise<{ minimumRaise: number, nextValidBid: number, incrementType: string, incrementValue: number }> {
    if (this.status !== 'ACTIVE') return { minimumRaise: 0, nextValidBid: this.currentBid, incrementType: 'PERCENT', incrementValue: 10 };

    // If no leader team has placed a bid yet, initial bid is Base Price itself
    if (!this.currentLeaderId) {
      return { minimumRaise: 0, nextValidBid: this.currentBid, incrementType: 'PERCENT', incrementValue: 10 };
    }

    // Fetch player category if currentPlayerId exists
    let playerCategoryId: string | null = null;
    if (this.currentPlayerId) {
      const player = await prisma.profile.findUnique({
        where: { userId: this.currentPlayerId },
        select: { categoryId: true }
      });
      playerCategoryId = player?.categoryId || null;
    }

    const rules = await prisma.bidRaiseRule.findMany({
      include: { category: true },
      orderBy: { minPrice: 'asc' }
    });

    let minimumRaise = Math.ceil(this.currentBid * 0.10);
    let incrementType = 'PERCENT';
    let incrementValue = 10;

    if (rules.length > 0) {
      // Priority 1: Match BOTH player category AND price range
      // Priority 2: Match ALL categories rule (categoryId is null) AND price range
      // Priority 3: Any rule matching price range
      let categoryRules = rules.filter(r => r.categoryId === playerCategoryId);
      if (categoryRules.length === 0) {
        categoryRules = rules.filter(r => !r.categoryId);
      }
      if (categoryRules.length === 0) {
        categoryRules = rules;
      }

      const matchingRule = categoryRules.find(r => this.currentBid >= r.minPrice && this.currentBid <= r.maxPrice) 
        || categoryRules[categoryRules.length - 1];

      if (matchingRule) {
        incrementType = (matchingRule as any).incrementType || 'PERCENT';
        incrementValue = matchingRule.incrementValue || 10;

        if (incrementType === 'PERCENT') {
          minimumRaise = Math.ceil(this.currentBid * (incrementValue / 100));
        } else {
          minimumRaise = Math.ceil(incrementValue);
        }
      }
    }

    const nextValidBid = this.currentBid + minimumRaise;
    return { minimumRaise, nextValidBid, incrementType, incrementValue };
  }

  public async broadcastState(targetSocket?: Socket) {
    const { minimumRaise, nextValidBid, incrementType, incrementValue } = await this.calculateNextBid();

    const system = await prisma.systemState.findFirst();
    const categories = await prisma.playerCategory.findMany({ orderBy: { basePrice: 'asc' } });
    const lowestBasePrice = categories.length > 0 ? categories[0].basePrice : 250;

    let currentPlayer = null;
    if (this.currentPlayerId) {
      currentPlayer = await prisma.profile.findUnique({
        where: { userId: this.currentPlayerId },
        include: { user: true, category: true }
      });
    }

    // Include teams with current player count for real-time manager roster counter
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        budget: true,
        managerId: true,
        _count: {
          select: { players: true }
        },
        players: {
          select: {
            id: true,
            category: { select: { name: true } }
          }
        }
      }
    });

    const payload = {
      status: this.status,
      mode: this.mode,
      currentPlayerId: this.currentPlayerId,
      currentPlayer,
      currentBid: this.currentBid,
      currentLeaderId: this.currentLeaderId,
      timer: this.timer,
      nextValidBid,
      minimumRaise,
      incrementType,
      incrementValue,
      minRoster: system?.minRoster || 11,
      lowestBasePrice,
      teams
    };

    if (targetSocket) {
      targetSocket.emit('AUCTION_STATE', payload);
    } else {
      this.io.emit('AUCTION_STATE', payload);
    }
  }
}
