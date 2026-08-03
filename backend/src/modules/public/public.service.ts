import prisma from '../../config/db';
import { TournamentService } from '../tournament/tournament.service';

export class PublicService {
  static async getLandingPageData() {
    const system = await prisma.systemState.findFirst();
    if (!system) throw new Error('System state not initialized');

    const phase = system.currentPhase;
    const basePayload = {
      phase,
      message: '',
      schedule: {
        registrationStart: system.registrationStart,
        registrationEnd: system.registrationEnd,
        auctionStart: system.auctionStart,
        auctionEnd: system.auctionEnd,
      }
    };

    switch (phase) {
      case 'SETUP':
        return {
          ...basePayload,
          message: 'Coming Soon: The event is currently being configured.',
          data: null
        };
        
      case 'REGISTRATION':
        return {
          ...basePayload,
          message: 'Registration is now open.',
          data: {
            categories: await prisma.playerCategory.findMany(),
            positions: await prisma.playerPosition.findMany(),
            sessions: await prisma.academicSession.findMany(),
          }
        };

      case 'AUCTION':
        return {
          ...basePayload,
          message: 'The Live Auction is happening right now!',
          data: {
            teams: await prisma.team.findMany({
              select: {
                id: true,
                name: true,
                logoUrl: true,
                budget: true,
                managerId: true,
                _count: { select: { players: true } },
                players: {
                  select: {
                    id: true,
                    category: { select: { name: true } }
                  }
                }
              }
            })
          }
        };

      case 'TOURNAMENT':
        return {
          ...basePayload,
          message: 'Welcome to the Football Dashboard!',
          data: {
            standings: await TournamentService.getStandings(),
            matches: {
              live: await prisma.match.findMany({ where: { status: 'LIVE' }, include: { homeTeam: true, awayTeam: true } }),
              upcoming: await prisma.match.findMany({ where: { status: 'UPCOMING' }, include: { homeTeam: true, awayTeam: true } }),
              finished: await prisma.match.findMany({ where: { status: 'FINISHED' }, include: { homeTeam: true, awayTeam: true }, take: 10, orderBy: { updatedAt: 'desc' } })
            },
            statistics: {
              playerStats: await TournamentService.getPlayerStats(),
            },
            news: await prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
          }
        };

      default:
        return basePayload;
    }
  }

  static async getNews() {
    return prisma.news.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
