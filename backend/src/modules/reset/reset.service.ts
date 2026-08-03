import prisma from '../../config/db';
import { CloudinaryService } from '../../services/cloudinary.service';
import logger from '../../utils/logger';
import { BackupService } from '../../utils/backup';
import { AuditService } from '../../services/audit.service';

export class ResetService {
  /**
   * LEVEL 1: Delete Matches, MatchEvents, Standings, News. Keep Auction.
   */
  static async executeLevel1() {
    return prisma.$transaction(async (tx) => {
      const matchEvents = await tx.matchEvent.deleteMany({});
      const matches = await tx.match.deleteMany({});
      const standings = await tx.standing.deleteMany({});
      const news = await tx.news.deleteMany({});

      await tx.systemState.updateMany({
        data: { currentPhase: 'AUCTION' }
      });

      return {
        level: 1,
        deleted: {
          matches: matches.count,
          matchEvents: matchEvents.count,
          standings: standings.count,
          news: news.count
        }
      };
    });
  }

  /**
   * LEVEL 2: Delete Players, Managers, Auction, Cloudinary Images. Keep Event Rules (Configs, System State).
   */
  static async executeLevel2(adminUserId: string) {
    const profiles = await prisma.profile.findMany({
      where: { publicId: { not: null } },
      select: { publicId: true }
    });

    const report = await prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({});
      await tx.match.deleteMany({});
      await tx.standing.deleteMany({});
      
      const ledgers = await tx.auctionLedger.deleteMany({});
      const notifications = await tx.notification.deleteMany({});
      
      const profilesDeleted = await tx.profile.deleteMany({});
      const teams = await tx.team.deleteMany({});
      
      const users = await tx.user.deleteMany({
        where: { role: { not: 'SUPER_ADMIN' } }
      });

      await tx.systemState.updateMany({
        data: { currentPhase: 'SETUP' }
      });

      return {
        level: 2,
        deleted: {
          ledgers: ledgers.count,
          notifications: notifications.count,
          profiles: profilesDeleted.count,
          teams: teams.count,
          users: users.count
        }
      };
    });

    const imagesToDelete = profiles.map(p => p.publicId).filter(id => id !== null) as string[];
    let deletedImagesCount = 0;
    
    await Promise.allSettled(
      imagesToDelete.map(async (publicId) => {
        try {
          await CloudinaryService.deleteImage(publicId);
          deletedImagesCount++;
        } catch (err) {}
      })
    );

    await AuditService.log({ action: 'RESET_LEVEL_2', resource: 'System', userId: adminUserId });
    return { ...report, deletedImages: deletedImagesCount };
  }

  /**
   * LEVEL 3: Delete Absolutely Everything except the Super Admin and SystemState singleton.
   */
  static async executeLevel3(adminUserId: string) {
    // 1. Create DB Backup
    await BackupService.createBackup();

    const profiles = await prisma.profile.findMany({
      where: { publicId: { not: null } },
      select: { publicId: true }
    });

    const report = await prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({});
      await tx.match.deleteMany({});
      await tx.standing.deleteMany({});
      await tx.auctionLedger.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.profile.deleteMany({});
      await tx.team.deleteMany({});
      await tx.news.deleteMany({});
      
      const categories = await tx.playerCategory.deleteMany({});
      const positions = await tx.playerPosition.deleteMany({});
      const sessions = await tx.academicSession.deleteMany({});
      const rules = await tx.bidRaiseRule.deleteMany({});

      const users = await tx.user.deleteMany({
        where: { role: { not: 'SUPER_ADMIN' } }
      });

      await tx.systemState.updateMany({
        data: { currentPhase: 'SETUP', totalBudget: 10000, minRoster: 11, maxRoster: 15 }
      });

      return {
        level: 3,
        deleted: {
          users: users.count,
          configurations: categories.count + positions.count + sessions.count + rules.count
        },
        systemState: 'Reset to SETUP'
      };
    });

    const imagesToDelete = profiles.map(p => p.publicId).filter(id => id !== null) as string[];
    let deletedImagesCount = 0;
    
    await Promise.allSettled(
      imagesToDelete.map(async (publicId) => {
        try {
          await CloudinaryService.deleteImage(publicId);
          deletedImagesCount++;
        } catch (err) {}
      })
    );

    await AuditService.log({ action: 'RESET_LEVEL_3', resource: 'System', userId: adminUserId });
    return { ...report, deletedImages: deletedImagesCount };
  }
}
