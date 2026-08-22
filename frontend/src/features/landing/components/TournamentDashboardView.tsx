import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Trophy, CalendarClock, Activity, Users, Medal, Goal, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { TournamentLeaderboard } from '../../tournament/TournamentLeaderboard';
import { MatchSummaryModal } from '../../../components/tournament/MatchSummaryModal';

interface TournamentDashboardViewProps {
  message?: string;
  data: any;
}

export const TournamentDashboardView = ({ message, data }: TournamentDashboardViewProps) => {
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any>(null);

  // Group Matches by fixtureGroupId for LEGGED
  const groupMatches = (matches: any[]) => {
    if (!matches) return [];
    
    const groups: { [key: string]: { leg1?: any, leg2?: any, aggregate?: any } } = {};
    const singles: any[] = [];

    matches.forEach(m => {
      if (m.type === 'SINGLE' || !m.fixtureGroupId) {
        singles.push(m);
      } else {
        if (!groups[m.fixtureGroupId]) groups[m.fixtureGroupId] = {};
        if (m.legNumber === 1) groups[m.fixtureGroupId].leg1 = m;
        if (m.legNumber === 2) groups[m.fixtureGroupId].leg2 = m;
      }
    });

    const legged = Object.values(groups).map(g => {
      if (g.leg1 && g.leg2) {
        return {
          isLegged: true,
          leg1: g.leg1,
          leg2: g.leg2,
          homeTeam: g.leg1.homeTeam,
          awayTeam: g.leg1.awayTeam,
          aggregate: {
            homeScore: g.leg1.homeScore + g.leg2.awayScore, // Team A home leg 1 + Team A away leg 2
            awayScore: g.leg1.awayScore + g.leg2.homeScore
          },
          status: g.leg2.status === 'FINISHED' ? 'FINISHED' : 'LIVE',
          round: g.leg1.round
        };
      }
      return g.leg1 || g.leg2;
    });

    return [...singles, ...legged];
  };

  const renderMatchScore = (match: any) => {
    if (match.isLegged) {
      return (
        <div className="flex flex-col items-center">
           <div className="font-black text-2xl text-primary">{match.aggregate.homeScore} - {match.aggregate.awayScore}</div>
           <div className="text-xs text-muted-foreground mt-1 text-center leading-tight">
             L1: {match.leg1.homeScore}-{match.leg1.awayScore}<br/>
             L2: {match.leg2.awayScore}-{match.leg2.homeScore}
           </div>
        </div>
      );
    }
    return (
      <div className="font-black text-2xl text-primary px-4">{match.homeScore} - {match.awayScore}</div>
    );
  };

  const liveMatches = groupMatches(data?.matches?.live || []);
  const upcomingMatches = data?.matches?.upcoming || [];
  const finishedMatches = groupMatches(data?.matches?.finished || []);

  const allMatchesList = [...liveMatches, ...finishedMatches];

  // Stats derivation
  const playerStats = data?.statistics?.playerStats || [];
  const topScorers = [...playerStats].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const topCards = [...playerStats].sort((a, b) => (b.yellowCards + b.redCards * 2) - (a.yellowCards + a.redCards * 2)).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <Badge variant="default" className="px-4 py-1.5 text-sm uppercase tracking-widest bg-primary">
          <Trophy className="w-4 h-4 mr-2 inline-block" /> Tournament Live
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight">University Football Tournament</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          {message || "Follow the live action, standings, and top performers."}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="matches" active={activeTab === 'matches'} onTabChange={setActiveTab} className="px-8 py-2.5 rounded-lg text-md font-semibold">
            <Activity className="w-4 h-4 mr-2 inline-block" /> Matches
          </TabsTrigger>
          <TabsTrigger value="standings" active={activeTab === 'standings'} onTabChange={setActiveTab} className="px-8 py-2.5 rounded-lg text-md font-semibold">
            <Trophy className="w-4 h-4 mr-2 inline-block" /> Points Table
          </TabsTrigger>
          <TabsTrigger value="stats" active={activeTab === 'stats'} onTabChange={setActiveTab} className="px-8 py-2.5 rounded-lg text-md font-semibold">
            <Medal className="w-4 h-4 mr-2 inline-block" /> Statistics
          </TabsTrigger>
        </TabsList>
      </div>

      {activeTab === 'matches' && (
        <div className="max-w-4xl mx-auto space-y-8">
          {liveMatches.length > 0 && (
            <Card className="border-destructive/30 shadow-lg">
              <CardHeader className="bg-destructive/5 border-b border-destructive/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Activity className="w-5 h-5 animate-pulse" /> Live Now
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {liveMatches.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background border shadow-sm rounded-xl">
                    <div className="w-1/3 text-right font-bold text-lg">{m.homeTeam?.name}</div>
                    <div className="w-1/3 flex justify-center">{renderMatchScore(m)}</div>
                    <div className="w-1/3 text-left font-bold text-lg">{m.awayTeam?.name}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="w-5 h-5"/> Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {upcomingMatches.length === 0 && <p className="text-muted-foreground text-center py-4">No upcoming matches</p>}
                {upcomingMatches.map((m: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg flex items-center justify-between text-sm bg-muted/10 hover:bg-muted/30 transition-colors">
                    <div className="font-medium truncate text-right flex-1">{m.homeTeam?.name}</div>
                    <div className="px-4 text-muted-foreground">vs</div>
                    <div className="font-medium truncate text-left flex-1">{m.awayTeam?.name}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="flex items-center gap-2 text-lg"><Trophy className="w-5 h-5"/> Recent Results</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                 {finishedMatches.length === 0 && <p className="text-muted-foreground text-center py-4">No finished matches</p>}
                 {finishedMatches.map((m: any, i: number) => (
                  <div 
                    key={i} 
                    className="p-3 border rounded-lg flex items-center justify-between text-sm hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedFinishedMatch(m)}
                  >
                    <div className="font-medium truncate text-right flex-1 group-hover:text-primary transition-colors">{m.homeTeam?.name}</div>
                    <div className="px-4 font-black text-primary bg-primary/10 rounded-md py-1 mx-2">{m.isLegged ? `${m.aggregate.homeScore}-${m.aggregate.awayScore}` : `${m.homeScore}-${m.awayScore}`}</div>
                    <div className="font-medium truncate text-left flex-1 group-hover:text-primary transition-colors">{m.awayTeam?.name}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'standings' && (
        <Card className="max-w-5xl mx-auto shadow-xl border-primary/20">
          <CardHeader className="bg-primary/5 border-b">
             <CardTitle className="text-xl">League Standings</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {data?.standings && data.standings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-16 text-center">Pos</TableHead>
                    <TableHead className="text-lg">Team</TableHead>
                    <TableHead className="text-center font-bold">P</TableHead>
                    <TableHead className="text-center font-bold">W</TableHead>
                    <TableHead className="text-center font-bold">D</TableHead>
                    <TableHead className="text-center font-bold">L</TableHead>
                    <TableHead className="text-center">GF</TableHead>
                    <TableHead className="text-center">GA</TableHead>
                    <TableHead className="text-center font-bold">GD</TableHead>
                    <TableHead className="text-center pr-6 font-black text-primary text-lg">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.standings.map((s: any, index: number) => (
                    <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-black text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-bold flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs overflow-hidden shadow-sm">
                           {s.team?.logoUrl ? <img src={s.team.logoUrl} alt="" className="w-full h-full object-cover" /> : s.team?.name?.charAt(0)}
                        </div>
                        {s.team?.name}
                      </TableCell>
                      <TableCell className="text-center font-medium text-lg">{s.played}</TableCell>
                      <TableCell className="text-center text-green-600 font-bold text-lg">{s.won}</TableCell>
                      <TableCell className="text-center text-gray-500 font-bold text-lg">{s.drawn}</TableCell>
                      <TableCell className="text-center text-red-600 font-bold text-lg">{s.lost}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{s.goalsFor}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{s.goalsAgainst}</TableCell>
                      <TableCell className="text-center font-bold text-lg">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</TableCell>
                      <TableCell className="text-center pr-6 font-black text-2xl text-primary">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground text-lg">
                The points table will update automatically once matches finish.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'stats' && (
        <div className="max-w-7xl mx-auto">
          <TournamentLeaderboard />
        </div>
      )}

      {selectedFinishedMatch && (
        <MatchSummaryModal 
          isOpen={!!selectedFinishedMatch}
          onClose={() => setSelectedFinishedMatch(null)}
          match={selectedFinishedMatch}
        />
      )}
    </div>
  );
};
