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

  static async getPlayerStats() {
    const events = await prisma.matchEvent.findMany({
      include: {
        player: { include: { user: true, team: true } },
        assist: { include: { user: true, team: true } }
      }
    });

    const stats = new Map<string, any>();

    const getStatsObj = (profile: any) => {
      if (!stats.has(profile.id)) {
        stats.set(profile.id, {
          player: profile,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          cleanSheets: 0,
        });
      }
      return stats.get(profile.id);
    };

    for (const event of events) {
      const pStat = getStatsObj(event.player);
      if (event.type === 'GOAL') pStat.goals++;
      if (event.type === 'YELLOW_CARD') pStat.yellowCards++;
      if (event.type === 'RED_CARD') pStat.redCards++;
      if (event.type === 'CLEAN_SHEET') pStat.cleanSheets++;

      if (event.assist) {
        const aStat = getStatsObj(event.assist);
        aStat.assists++;
      }
    }

    return Array.from(stats.values());
  }
}
