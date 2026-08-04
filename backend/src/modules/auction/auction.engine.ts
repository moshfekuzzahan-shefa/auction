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

  // In-Memory Cache for Instant (<1ms) Socket Emits
  private cachedPlayer: any = null;
  private cachedRules: any[] = [];
  private cachedSystem: any = null;
  private cachedTeams: any[] = [];
  private lowestBasePrice: number = 250;

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
    
    // Fetch and cache all player & system metadata cleanly in memory once on stage start
    const [player, rules, system, categories, teams] = await Promise.all([
      prisma.profile.findFirst({
        where: {
          OR: [
            { userId: playerId },
            { id: playerId }
          ]
        },
        include: { user: true, category: true }
      }),
      prisma.bidRaiseRule.findMany({
        include: { category: true },
        orderBy: { minPrice: 'asc' }
      }),
      prisma.systemState.findFirst(),
      prisma.playerCategory.findMany({ orderBy: { basePrice: 'asc' } }),
      prisma.team.findMany({
        select: {
          id: true,
          name: true,
          logoUrl: true,
          budget: true,
          managerId: true,
          _count: { select: { players: true } },
          players: { select: { id: true, category: { select: { name: true } } } }
        }
      })
    ]);

    if (!player) {
      throw new Error('Player profile not found for podium auction');
    }

    const calculatedBasePrice = basePriceOverride || player.basePrice || player.category?.basePrice || 500;

    this.cachedPlayer = player;
    this.cachedRules = rules;
    this.cachedSystem = system;
    this.cachedTeams = teams;
    this.lowestBasePrice = categories.length > 0 ? categories[0].basePrice : 250;

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
    this.currentPlayerId = null;
    this.currentBid = 0;
    this.currentLeaderId = null;
    this.cachedPlayer = null;
    this.broadcastState();
  }

  public async rollback(ledgerId: string) {
    const ledgerEntry = await prisma.auctionLedger.findUnique({
      where: { id: ledgerId },
      include: { team: true }
    });

    if (!ledgerEntry || ledgerEntry.status === 'ROLLBACK') {
      throw new Error('Invalid or already rolled-back ledger entry');
    }

    await prisma.$transaction([
      prisma.auctionLedger.update({
        where: { id: ledgerId },
        data: { status: 'ROLLBACK' }
      }),
      prisma.profile.update({
        where: { userId: ledgerEntry.playerId },
        data: { isSold: false, soldPrice: null, teamId: null }
      }),
      prisma.team.update({
        where: { id: ledgerEntry.teamId },
        data: { budget: { increment: ledgerEntry.amount } }
      })
    ]);

    await AuditService.log({
      action: 'AUCTION_ROLLBACK',
      resource: 'AuctionEngine',
      metadata: { ledgerId, playerId: ledgerEntry.playerId, teamId: ledgerEntry.teamId, amount: ledgerEntry.amount }
    });

    this.broadcastState();
  }

  public extendTimer(seconds: number = 10) {
    this.timer += seconds;
    this.io.emit('TIMER_TICK', { timer: this.timer });
    this.io.emit('timer_tick', { timer: this.timer });
  }

  public toggleBidMode(newMode: AuctionMode) {
    this.mode = newMode;
    this.broadcastState();
  }

  // --- Real-time Bidding Handler ---

  public placeBid(teamId: string, amount: number, senderSocket?: Socket) {
    if (this.status !== 'ACTIVE') {
      if (senderSocket) {
        senderSocket.emit('ERROR', 'Auction is not active!');
        senderSocket.emit('error', 'Auction is not active!');
      }
      return;
    }

    if (this.currentLeaderId === teamId) {
      const errMsg = 'Your team is already the highest bidder!';
      if (senderSocket) {
        senderSocket.emit('ERROR', errMsg);
        senderSocket.emit('error', errMsg);
      }
      this.io.to(`team_${teamId}`).emit('ERROR', errMsg);
      this.io.to(`team_${teamId}`).emit('error', errMsg);
      return;
    }

    const { nextValidBid } = this.calculateNextBidSync();
    if (this.currentLeaderId && amount < nextValidBid) {
      const errMsg = `Bid increment too low. Next valid bid must be at least $${nextValidBid.toLocaleString()}`;
      if (senderSocket) {
        senderSocket.emit('ERROR', errMsg);
        senderSocket.emit('error', errMsg);
      }
      this.io.to(`team_${teamId}`).emit('ERROR', errMsg);
      this.io.to(`team_${teamId}`).emit('error', errMsg);
      return;
    }

    if (this.mode === 'NORMAL') {
      // INSTANT IN-MEMORY STATE MUTATION & IMMEDIATE SOCKET BROADCAST (<1ms)
      this.currentBid = amount;
      this.currentLeaderId = teamId;
      this.timer = 30; // Reset timer on valid bid

      this.io.emit('BID_PLACED', { teamId, amount });
      this.io.emit('bid_placed', { teamId, amount });
      this.broadcastState();

      // Background Async Database Check (does not block immediate socket emission)
      this.enqueue(async () => {
        await prisma.$transaction(async (tx) => {
          const { isValid, error } = await this.validateBidEligibility(tx, teamId, amount);
          if (!isValid) {
            logger.warn(`Asynchronous bid eligibility check failed for team ${teamId}: ${error}`);
          }
        });
      });

    } else if (this.mode === 'BLIND') {
      this.blindBids.set(teamId, amount);
      if (senderSocket) {
        senderSocket.emit('SUCCESS', 'Blind bid registered');
        senderSocket.emit('success', 'Blind bid registered');
      }
      this.io.to(`team_${teamId}`).emit('SUCCESS', 'Blind bid registered');
      this.io.to(`team_${teamId}`).emit('success', 'Blind bid registered');
    }
  }

  // --- Internal Synchronous Engine Logic ---

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(async () => {
      if (this.timer > 0) {
        this.timer--;
        this.io.emit('TIMER_TICK', { timer: this.timer });
        this.io.emit('timer_tick', { timer: this.timer });
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

    let winnerId: string | null = null;
    let finalAmount: number = 0;

    if (this.mode === 'NORMAL') {
      winnerId = this.currentLeaderId;
      finalAmount = this.currentBid;
    } else {
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
      // Persist sale to DB inside Transaction
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
        
        await tx.profile.update({
          where: { userId: this.currentPlayerId! },
          data: { isSold: true, soldPrice: finalAmount, teamId: winnerId }
        });

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

      // Update in-memory cache for immediate broadcast sync
      const winningTeam = this.cachedTeams.find(t => t.id === winnerId);
      if (winningTeam) {
        winningTeam.budget -= finalAmount;
        if (!winningTeam._count) winningTeam._count = { players: 0 };
        winningTeam._count.players += 1;
      }
      const playerName = this.cachedPlayer?.user?.name || 'Unknown Player';
      const winnerName = winningTeam?.name || 'Unknown Team';

      this.io.emit('PLAYER_SOLD', { winnerId, winnerName, finalAmount, playerId: this.currentPlayerId, playerName });
      this.io.emit('player_sold', { winnerId, winnerName, finalAmount, playerId: this.currentPlayerId, playerName });
    } else {
      const playerName = this.cachedPlayer?.user?.name || 'Unknown Player';
      this.io.emit('PLAYER_UNSOLD', { result: 'UNSOLD', playerId: this.currentPlayerId, playerName });
      this.io.emit('player_unsold', { result: 'UNSOLD', playerId: this.currentPlayerId, playerName });
    }
    
    this.currentPlayerId = null;
    this.cachedPlayer = null;
    this.broadcastState();
  }

  public calculateNextBidSync(): { minimumRaise: number, nextValidBid: number, incrementType: string, incrementValue: number } {
    if (this.status !== 'ACTIVE') {
      return { minimumRaise: 0, nextValidBid: this.currentBid, incrementType: 'PERCENT', incrementValue: 10 };
    }

    if (!this.currentLeaderId) {
      return { minimumRaise: 0, nextValidBid: this.currentBid, incrementType: 'PERCENT', incrementValue: 10 };
    }

    const playerCategoryId = this.cachedPlayer?.categoryId || null;
    const rules = this.cachedRules || [];

    let minimumRaise = Math.ceil(this.currentBid * 0.10);
    let incrementType = 'PERCENT';
    let incrementValue = 10;

    if (rules.length > 0) {
      let matchingRule = playerCategoryId 
        ? rules.find((r: any) => r.categoryId === playerCategoryId && this.currentBid >= r.minPrice && this.currentBid <= r.maxPrice)
        : null;

      if (!matchingRule) {
        matchingRule = rules.find((r: any) => !r.categoryId && this.currentBid >= r.minPrice && this.currentBid <= r.maxPrice);
      }

      if (!matchingRule && playerCategoryId) {
        const catRules = rules.filter((r: any) => r.categoryId === playerCategoryId);
        if (catRules.length > 0) matchingRule = catRules[catRules.length - 1];
      }

      if (!matchingRule) {
        matchingRule = rules[rules.length - 1];
      }

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

    const globalMinIncrement = 10;
    minimumRaise = Math.max(minimumRaise, globalMinIncrement);

    const nextValidBid = this.currentBid + minimumRaise;
    return { minimumRaise, nextValidBid, incrementType, incrementValue };
  }

  public broadcastState(targetSocket?: Socket) {
    const { minimumRaise, nextValidBid, incrementType, incrementValue } = this.calculateNextBidSync();

    const payload = {
      status: this.status,
      mode: this.mode,
      currentPlayerId: this.currentPlayerId,
      currentPlayer: this.cachedPlayer,
      currentBid: this.currentBid,
      currentLeaderId: this.currentLeaderId,
      timer: this.timer,
      nextValidBid,
      minimumRaise,
      incrementType,
      incrementValue,
      minRoster: this.cachedSystem?.minRoster || 11,
      lowestBasePrice: this.lowestBasePrice,
      teams: this.cachedTeams
    };

    if (targetSocket) {
      targetSocket.emit('AUCTION_STATE', payload);
      targetSocket.emit('auction_state', payload);
    } else {
      this.io.emit('AUCTION_STATE', payload);
      this.io.emit('auction_state', payload);
    }
  }

  private async validateBidEligibility(tx: Prisma.TransactionClient, teamId: string, bidAmount: number): Promise<{ isValid: boolean, error?: string }> {
    const teamRaw = await tx.$queryRaw<any[]>`SELECT * FROM "Team" WHERE id = ${teamId} FOR UPDATE`;
    const team = teamRaw[0];

    if (!team) {
      return { isValid: false, error: 'Team not found' };
    }

    if (team.budget < bidAmount) {
      return { isValid: false, error: `Insufficient budget. Remaining: $${team.budget.toLocaleString()}` };
    }

    const systemState = await tx.systemState.findFirst();
    const minRosterNeeded = systemState?.minRoster || 11;

    const boughtCount = await tx.profile.count({
      where: { teamId }
    });

    const categories = await tx.playerCategory.findMany({ orderBy: { basePrice: 'asc' } });
    const lowestBasePrice = categories.length > 0 ? categories[0].basePrice : 250;

    const remainingSlotsAfterThisPlayer = Math.max(0, minRosterNeeded - (boughtCount + 1));
    const reserveNeeded = remainingSlotsAfterThisPlayer * lowestBasePrice;
    const maxAllowableBid = team.budget - reserveNeeded;

    if (bidAmount > maxAllowableBid) {
      return {
        isValid: false,
        error: `Disqualified! Bidding $${bidAmount.toLocaleString()} leaves insufficient budget ($${(team.budget - bidAmount).toLocaleString()}) to fill min roster of ${minRosterNeeded} players (Reserve needed: $${reserveNeeded.toLocaleString()}).`
      };
    }

    return { isValid: true };
  }
}
