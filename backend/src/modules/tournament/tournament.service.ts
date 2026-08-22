import prisma from '../../config/db';

export class TournamentService {
  static async createFixture(data: { homeTeamId: string, awayTeamId: string, type: 'SINGLE' | 'LEGGED', round: string, scheduledTime?: string, venue?: string }) {
    const scheduledTime = data.scheduledTime ? new Date(data.scheduledTime) : null;
    if (data.type === 'SINGLE') {
      return prisma.match.create({
        data: {
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          type: 'SINGLE',
          round: data.round,
          scheduledTime,
          venue: data.venue
        }
      });
    } else {
      const fixtureGroupId = Math.random().toString(36).substring(7); // simple random ID
      
      const [leg1, leg2] = await prisma.$transaction([
        prisma.match.create({
          data: {
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            type: 'LEGGED',
            round: data.round,
            fixtureGroupId,
            legNumber: 1,
            scheduledTime,
            venue: data.venue
          }
        }),
        prisma.match.create({
          data: {
            homeTeamId: data.awayTeamId,
            awayTeamId: data.homeTeamId,
            type: 'LEGGED',
            round: data.round,
            fixtureGroupId,
            legNumber: 2,
            scheduledTime, // might want separate times in the real world, but okay for MVP
            venue: data.venue
          }
        })
      ]);

      return { leg1, leg2 };
    }
  }

  static async generateAutoFixtures() {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' }
    });

    if (teams.length < 2) {
      throw new Error('At least 2 registered franchise teams are required to generate tournament fixtures.');
    }

    const matchesToCreate: any[] = [];
    const venues = ['Central Stadium', 'Main Arena', 'Stadium B', 'University Grounds'];

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchesToCreate.push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          type: 'SINGLE' as const,
          round: 'Group Stage',
          venue: venues[(i + j) % venues.length],
          status: 'UPCOMING' as const,
          scheduledTime: new Date(Date.now() + (matchesToCreate.length + 1) * 86400000)
        });
      }
    }

    await prisma.match.createMany({
      data: matchesToCreate
    });

    return prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async deleteFixture(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  static async getFixtures() {
    return prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { scheduledTime: 'asc' }
    });
  }

  static async logEvent(matchId: string, event: { type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'OWN_GOAL' | 'CLEAN_SHEET', playerId: string, assistId?: string, minute: number }) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');

    const player = await prisma.profile.findUnique({ where: { id: event.playerId } });
    if (!player || !player.teamId) throw new Error('Player not found or not in a team');

    // Start transaction to log event and update match score
    return prisma.$transaction(async (tx) => {
      const matchEvent = await tx.matchEvent.create({
        data: {
          matchId,
          playerId: event.playerId,
          assistId: event.assistId,
          type: event.type,
          minute: event.minute
        }
      });

      if (event.type === 'GOAL') {
        const isHome = player.teamId === match.homeTeamId;
        await tx.match.update({
          where: { id: matchId },
          data: isHome ? { homeScore: { increment: 1 } } : { awayScore: { increment: 1 } }
        });
      }

      if (event.type === 'OWN_GOAL') {
        // Own goal gives point to the OTHER team
        const isHome = player.teamId === match.homeTeamId;
        await tx.match.update({
          where: { id: matchId },
          data: isHome ? { awayScore: { increment: 1 } } : { homeScore: { increment: 1 } }
        });
      }

      return matchEvent;
    });
  }

  static async updateStatus(matchId: string, status: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');

    if (match.status === status) return match;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: status as any }
    });

    if (status === 'FINISHED') {
      await this.recalculateStandings();
    }

    return updatedMatch;
  }

  static async recalculateStandings() {
    const teams = await prisma.team.findMany();
    const finishedMatches = await prisma.match.findMany({ where: { status: 'FINISHED' } });

    for (const team of teams) {
      let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;

      for (const m of finishedMatches) {
        if (m.homeTeamId === team.id) {
          played++;
          gf += m.homeScore;
          ga += m.awayScore;
          if (m.homeScore > m.awayScore) won++;
          else if (m.homeScore === m.awayScore) drawn++;
          else lost++;
        } else if (m.awayTeamId === team.id) {
          played++;
          gf += m.awayScore;
          ga += m.homeScore;
          if (m.awayScore > m.homeScore) won++;
          else if (m.homeScore === m.awayScore) drawn++;
          else lost++;
        }
      }

      const points = (won * 3) + (drawn * 1);
      const gd = gf - ga;

      await prisma.standing.upsert({
        where: { teamId: team.id },
        update: { played, won, drawn, lost, goalsFor: gf, goalsAgainst: ga, goalDifference: gd, points },
        create: { teamId: team.id, played, won, drawn, lost, goalsFor: gf, goalsAgainst: ga, goalDifference: gd, points }
      });
    }
  }

  static async getStandings() {
    return prisma.standing.findMany({
      include: { team: true },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' }
      ]
    });
  }

  static async submitMatchResult(matchId: string, resultData: { homeScore: number, awayScore: number, motmPlayerId?: string, events: any[] }) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');

    const eventsToCreate: any[] = [];
    for (const ev of resultData.events) {
      eventsToCreate.push({
        matchId,
        playerId: ev.playerId,
        assistId: ev.assistId || null,
        type: ev.type,
        minute: ev.minute || 0
      });

      if (ev.type === 'GOAL' && ev.assistId) {
        eventsToCreate.push({
          matchId,
          playerId: ev.assistId,
          assistId: null,
          type: 'ASSIST',
          minute: ev.minute || 0
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      if (eventsToCreate.length > 0) {
        await tx.matchEvent.createMany({
          data: eventsToCreate
        });
      }

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore: resultData.homeScore,
          awayScore: resultData.awayScore,
          motmPlayerId: resultData.motmPlayerId || null,
          status: 'FINISHED'
        }
      });

      return updatedMatch;
    }).then(async (result) => {
      await this.recalculateStandings();
      return result;
    });
  }

  static async getLeaderboardStats() {
    const goalsGroups = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: { type: 'GOAL', match: { status: 'FINISHED' } },
      _count: { type: true },
    });

    const assistsGroups = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: { type: 'ASSIST', match: { status: 'FINISHED' } },
      _count: { type: true },
    });

    const missesGroups = await prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: { type: 'MISS', match: { status: 'FINISHED' } },
      _count: { type: true },
    });

    const motmGroups = await prisma.match.groupBy({
      by: ['motmPlayerId'],
      where: { motmPlayerId: { not: null }, status: 'FINISHED' },
      _count: { motmPlayerId: true },
    });

    const allPlayers = await prisma.profile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        team: { include: { standing: { select: { played: true } } } },
        category: { select: { name: true } }
      }
    });

    const playerMap = new Map();
    allPlayers.forEach(p => playerMap.set(p.id, p));

    const mapWithPlayer = (groups: any[], countField: string, mapCountKey: string) => {
      return groups.map(g => {
        const pId = g.playerId || g.motmPlayerId;
        const p = playerMap.get(pId);
        return {
          playerId: pId,
          name: p?.user?.name || 'Unknown',
          imageUrl: p?.imageUrl || null,
          teamName: p?.team?.name || 'Unassigned',
          teamLogo: p?.team?.logoUrl || null,
          played: p?.team?.standing?.played || 0,
          category: p?.category?.name || 'Unassigned',
          [countField]: Number(g._count[mapCountKey])
        };
      }).sort((a, b) => {
        if (b[countField] !== a[countField]) return b[countField] - a[countField];
        if (a.played !== b.played) return a.played - b.played; 
        return a.name.localeCompare(b.name);
      });
    };

    return {
      topScorers: mapWithPlayer(goalsGroups, 'goals', 'type').slice(0, 10),
      topAssists: mapWithPlayer(assistsGroups, 'assists', 'type').slice(0, 10),
      mostMisses: mapWithPlayer(missesGroups, 'misses', 'type').slice(0, 10),
      motmKings: mapWithPlayer(motmGroups, 'motmAwards', 'motmPlayerId').slice(0, 10)
    };
  }
}
