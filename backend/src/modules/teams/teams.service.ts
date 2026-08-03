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
          include: { user: { select: { name: true } } }
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
}
