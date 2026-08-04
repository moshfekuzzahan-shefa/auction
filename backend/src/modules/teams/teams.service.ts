import prisma from '../../config/db';

export class TeamsService {
  static async getTeamDashboardData(managerId: string) {
    const team = await prisma.team.findUnique({
      where: { managerId },
      include: {
        players: {
          select: {
            id: true,
            userId: true,
            primaryPos: true,
            secondaryPos: true,
            soldPrice: true,
            imageUrl: true,
            user: { select: { name: true } }
          }
        },
        ledgers: {
          orderBy: { timestamp: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!team) throw new Error('Team not found for this manager');

    const system = await prisma.systemState.findFirst();
    const initialBudget = system?.totalBudget || 0;

    // Calculate Statistics
    const totalPlayers = team.players.length;
    const positionStats = team.players.reduce((acc, player) => {
      const pos = player.primaryPos || 'UNKNOWN';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      teamInfo: {
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        initialBudget,
        currentBudget: team.budget,
        spentBudget: initialBudget - team.budget
      },
      squad: team.players,
      history: team.ledgers,
      notifications: team.notifications,
      statistics: {
        totalPlayers,
        positionBreakdown: positionStats
      }
    };
  }

  static async markNotificationsRead(teamId: string) {
    return prisma.notification.updateMany({
      where: { teamId, isRead: false },
      data: { isRead: true }
    });
  }

  static async getTeams() {
    return prisma.team.findMany({
      include: {
        manager: { select: { name: true, email: true } },
        players: {
          include: {
            category: { select: { name: true, basePrice: true } },
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async registerTeam(data: any, fileBuffer: Buffer) {
    const { teamName, managerName, managerEmail, managerPassword } = data;
    
    // Check if team name or email exists
    const existingUser = await prisma.user.findUnique({ where: { email: managerEmail } });
    if (existingUser) throw new Error('Email already in use');

    const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });
    if (existingTeam) throw new Error('Team name already taken');

    const system = await prisma.systemState.findFirst();
    const initialBudget = system?.totalBudget || 10000;

    // Upload Logo
    const cloudinary = require('cloudinary').v2;
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'football_platform/teams' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    const logoUrl = (uploadResult as any).secure_url;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(managerPassword, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: managerName,
          email: managerEmail,
          password: hashedPassword,
          role: 'TEAM_MANAGER'
        }
      });

      const team = await tx.team.create({
        data: {
          name: teamName,
          logoUrl,
          budget: initialBudget,
          managerId: user.id
        }
      });

      return team;
    });
  }

  static async requestTeam(userId: string, data: any, fileBuffer?: Buffer) {
    const existingTeam = await prisma.team.findUnique({ where: { name: data.name } });
    if (existingTeam) throw new Error(`Team name "${data.name}" is already registered.`);

    const system = await prisma.systemState.findFirst();
    const initialBudget = system?.totalBudget || 10000;

    let logoUrl = data.logoUrl || null;

    if (fileBuffer) {
      const { CloudinaryService } = require('../../services/cloudinary.service');
      const uploadResult = await CloudinaryService.uploadImage(fileBuffer, 'football_platform/teams');
      logoUrl = uploadResult.url;
    }

    return prisma.team.create({
      data: {
        name: data.name,
        code: data.code || data.name.substring(0, 3).toUpperCase(),
        logoUrl: logoUrl,
        brandColor: data.brandColor || '#10B981',
        status: 'PENDING_VERIFICATION',
        budget: initialBudget,
        requestedById: userId,
        contactBio: data.contactBio || null,
      }
    });
  }

  static async getPendingRequests() {
    const pendingTeams = await prisma.team.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      orderBy: { createdAt: 'desc' }
    });

    const userIds = pendingTeams.map(t => t.requestedById).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return pendingTeams.map(team => ({
      ...team,
      requester: team.requestedById ? userMap.get(team.requestedById) : null
    }));
  }

  static async verifyTeamRequest(teamId: string, action: 'APPROVE' | 'REJECT') {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new Error('Team request not found.');

    if (action === 'REJECT') {
      const updated = await prisma.team.update({
        where: { id: teamId },
        data: { status: 'REJECTED' }
      });

      if (team.requestedById) {
        await prisma.profile.updateMany({
          where: { userId: team.requestedById },
          data: {
            hasUnreadAdminUpdates: true,
            lastAdminChange: `Your team request for "${team.name}" was rejected by the admin.`
          }
        });
      }
      return updated;
    }

    return prisma.$transaction(async (tx) => {
      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: {
          status: 'ACTIVE',
          ...(team.requestedById ? { managerId: team.requestedById } : {})
        }
      });

      if (team.requestedById) {
        await tx.user.update({
          where: { id: team.requestedById },
          data: { role: 'TEAM_MANAGER' }
        });

        await tx.profile.updateMany({
          where: { userId: team.requestedById },
          data: {
            teamId: team.id,
            isSold: true,
            hasUnreadAdminUpdates: true,
            lastAdminChange: `🎉 CONGRATULATIONS! Your team "${team.name}" has been approved! You are now the Franchise Manager & Owner.`
          }
        });
      }

      return updatedTeam;
    });
  }
}
