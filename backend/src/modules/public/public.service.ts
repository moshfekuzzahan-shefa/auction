import prisma from '../../config/db';
import { TournamentService } from '../tournament/tournament.service';

export class PublicService {
  static async getLandingPageData() {
    const system = await prisma.systemState.findFirst();
    if (!system) throw new Error('System state not initialized');

    const phase = system.currentPhase;
    const categories = await prisma.playerCategory.findMany({ orderBy: { basePrice: 'desc' } });
    const positions = await prisma.playerPosition.findMany();

    const basePayload = {
      phase,
      message: '',
      announcement: system.announcement || 'IPL & FUT Style Live Auction Podium',
      schedule: {
        registrationStart: system.registrationStart,
        registrationEnd: system.registrationEnd,
        auctionStart: system.auctionStart,
        auctionEnd: system.auctionEnd,
      }
    };

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        budget: true,
        managerId: true,
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { players: true } },
        players: {
          select: {
            id: true,
            imageUrl: true,
            jerseyName: true,
            studentId: true,
            session: true,
            primaryPos: true,
            secondaryPos: true,
            soldPrice: true,
            basePrice: true,
            user: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true, basePrice: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    switch (phase) {
      case 'SETUP':
        return {
          ...basePayload,
          message: 'Coming Soon: The event is currently being configured.',
          data: {
            categories,
            positions,
            teams
          }
        };
        
      case 'REGISTRATION':
        return {
          ...basePayload,
          message: 'Registration is now open.',
          data: {
            categories,
            positions,
            teams,
            sessions: await prisma.academicSession.findMany(),
          }
        };

      case 'AUCTION':
        return {
          ...basePayload,
          message: 'The Live Auction is happening right now!',
          data: {
            categories,
            positions,
            teams
          }
        };

      case 'TOURNAMENT':
        return {
          ...basePayload,
          message: 'Welcome to the Football Dashboard!',
          data: {
            categories,
            positions,
            teams,
            standings: await TournamentService.getStandings(),
            matches: {
              live: await prisma.match.findMany({ where: { status: 'LIVE' }, include: { homeTeam: true, awayTeam: true } }),
              upcoming: await prisma.match.findMany({ where: { status: 'UPCOMING' }, include: { homeTeam: true, awayTeam: true } }),
              finished: await prisma.match.findMany({ where: { status: 'FINISHED' }, include: { homeTeam: true, awayTeam: true }, take: 10, orderBy: { updatedAt: 'desc' } })
            },
            statistics: {
              playerStats: await TournamentService.getLeaderboardStats(),
            },
            news: await prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
          }
        };

      default:
        return {
          ...basePayload,
          data: { categories, positions }
        };
    }
  }

  static async getCategories() {
    return prisma.playerCategory.findMany({ orderBy: { basePrice: 'desc' } });
  }

  static async getNews() {
    return prisma.news.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
