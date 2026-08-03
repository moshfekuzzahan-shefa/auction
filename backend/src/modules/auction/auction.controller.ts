import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';

export class AuctionController {
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await prisma.auctionLedger.findMany({
        where: { status: 'SOLD' },
        include: {
          team: { select: { name: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      
      const playerIds = history.map(h => h.playerId);
      const profiles = await prisma.profile.findMany({
        where: { userId: { in: playerIds } },
        include: { user: { select: { name: true } } }
      });
      
      const enrichedHistory = history.map(h => {
        const p = profiles.find(pr => pr.userId === h.playerId);
        return {
          ...h,
          playerName: p?.user?.name || 'Unknown Player'
        };
      });
      
      res.status(200).json({ success: true, data: enrichedHistory });
    } catch (error) {
      next(error);
    }
  }
}
