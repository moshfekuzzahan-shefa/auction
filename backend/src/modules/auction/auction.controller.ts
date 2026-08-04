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

  static async getBidRaiseRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await prisma.bidRaiseRule.findMany({
        include: { category: true },
        orderBy: { minPrice: 'asc' }
      });
      res.status(200).json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  static async updateBidRaiseRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rulesArray = Array.isArray(req.body) ? req.body : (req.body.rules || []);
      const updatedRules = await prisma.$transaction(async (tx) => {
        await tx.bidRaiseRule.deleteMany({});
        if (rulesArray.length > 0) {
          await tx.bidRaiseRule.createMany({
            data: rulesArray.map((r: any) => ({
              minPrice: Number(r.minPrice) || 0,
              maxPrice: Number(r.maxPrice) || 100000,
              incrementType: r.incrementType === 'FIXED' ? 'FIXED' : 'PERCENT',
              incrementValue: Number(r.incrementValue) || 10,
              categoryId: r.categoryId && String(r.categoryId).trim() !== '' ? String(r.categoryId) : null
            }))
          });
        }
        return tx.bidRaiseRule.findMany({ include: { category: true }, orderBy: { minPrice: 'asc' } });
      });

      res.status(200).json({ success: true, message: 'Bid raise rules updated successfully', data: updatedRules });
    } catch (error) {
      next(error);
    }
  }
}
