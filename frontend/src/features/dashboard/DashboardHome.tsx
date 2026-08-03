import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LiveAuctionPublicPodium } from '../landing/components/LiveAuctionPublicPodium';
import { PlayerDashboardRegistrationView } from './components/PlayerDashboardRegistrationView';
import { useAppSelector } from '../../store/hooks';
import api from '../../services/api';

const CountdownTimer = ({ targetDate, label }: { targetDate: Date; label: string }) => {
  const [timeLeft, setTimeLeft] = useState(targetDate.getTime() - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetDate.getTime() - new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft <= 0) {
    return null; // The logic outside should prevent this, but just in case
  }

  const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeft / 1000 / 60) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shadow-lg">
      <h3 className="text-xl font-bold tracking-tight text-primary uppercase">{label}</h3>
      <div className="flex gap-2 lg:gap-4 text-center">
        <div className="flex flex-col items-center w-16 lg:w-24">
          <span className="text-4xl lg:text-6xl font-black font-mono text-foreground">{d.toString().padStart(2, '0')}</span>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mt-2">Days</span>
        </div>
        <span className="text-4xl lg:text-6xl font-black text-primary/50">:</span>
        <div className="flex flex-col items-center w-16 lg:w-24">
          <span className="text-4xl lg:text-6xl font-black font-mono text-foreground">{h.toString().padStart(2, '0')}</span>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mt-2">Hours</span>
        </div>
        <span className="text-4xl lg:text-6xl font-black text-primary/50">:</span>
        <div className="flex flex-col items-center w-16 lg:w-24">
          <span className="text-4xl lg:text-6xl font-black font-mono text-foreground">{m.toString().padStart(2, '0')}</span>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mt-2">Mins</span>
        </div>
        <span className="text-4xl lg:text-6xl font-black text-primary/50">:</span>
        <div className="flex flex-col items-center w-16 lg:w-24">
          <span className="text-4xl lg:text-6xl font-black font-mono text-foreground">{s.toString().padStart(2, '0')}</span>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mt-2">Secs</span>
        </div>
      </div>
      <div className="text-sm font-medium text-muted-foreground mt-4 bg-background/50 px-4 py-1.5 rounded-full">
        Scheduled for: <span className="text-foreground">{targetDate.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export const DashboardHome = () => {
  const user = useAppSelector((state) => state.auth.user);

  const { data: landingData, isLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const phase = landingData?.data?.phase;
  const message = landingData?.message;
  const schedule = landingData?.data?.schedule;
  const data = landingData?.data?.data;

  let targetDate = null;
  let countdownLabel = '';
  const now = new Date();

  if (phase === 'SETUP' || phase === 'REGISTRATION') {
    const rStart = schedule?.registrationStart ? new Date(schedule.registrationStart) : null;
    const rEnd = schedule?.registrationEnd ? new Date(schedule.registrationEnd) : null;

    if (rStart && rStart > now) {
      targetDate = rStart;
      countdownLabel = 'Registration Opens In';
    } else if (rEnd && rEnd > now) {
      targetDate = rEnd;
      countdownLabel = 'Registration Closes In';
    }
  } else if (phase === 'AUCTION') {
    const aStart = schedule?.auctionStart ? new Date(schedule.auctionStart) : null;
    const aEnd = schedule?.auctionEnd ? new Date(schedule.auctionEnd) : null;

    if (aStart && aStart > now) {
      targetDate = aStart;
      countdownLabel = 'Live Auction Starts In';
    } else if (aEnd && aEnd > now) {
      targetDate = aEnd;
      countdownLabel = 'Live Auction Ends In';
    }
  } else if (phase === 'TOURNAMENT' && data?.matches?.upcoming?.length > 0) {
    const upcomingWithTime = data.matches.upcoming
      .filter((m: any) => m.scheduledTime && new Date(m.scheduledTime) > now)
      .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    if (upcomingWithTime.length > 0) {
      targetDate = new Date(upcomingWithTime[0].scheduledTime);
      countdownLabel = `Next Match: ${upcomingWithTime[0].homeTeam.name} vs ${upcomingWithTime[0].awayTeam.name}`;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-md border border-primary/20 capitalize">
          Current Phase: {phase?.toLowerCase()}
        </div>
      </div>
      
      {targetDate && (
        <CountdownTimer targetDate={targetDate} label={countdownLabel} />
      )}

      {phase === 'AUCTION' ? (
        <div className="pt-2">
          <LiveAuctionPublicPodium data={data} message={message} schedule={schedule} isReadOnly={true} />
        </div>
      ) : phase !== 'TOURNAMENT' ? (
        phase === 'REGISTRATION' && user?.role === 'PLAYER' ? (
          <PlayerDashboardRegistrationView />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">{message}</h2>
              <p className="text-muted-foreground">Match fixtures and standings will appear here once the tournament begins.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Fixtures */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Live & Upcoming Fixtures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.matches?.live?.length === 0 && data?.matches?.upcoming?.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground border rounded-md">
                    No fixtures currently scheduled.
                  </div>
                )}
                
                {[...(data?.matches?.live || []), ...(data?.matches?.upcoming || [])].map((match: any) => (
                  <div key={match.id} className="flex flex-col p-4 border rounded-md relative overflow-hidden">
                    {match.status === 'LIVE' && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-md animate-pulse">
                        LIVE
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <div>
                        {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'TBD'}
                        {match.venue && <span className="ml-2 px-2 py-0.5 bg-muted rounded-full">📍 {match.venue}</span>}
                      </div>
                      <div className="font-medium bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-md text-xs">
                        {match.round} {match.type === 'LEGGED' && `(Leg ${match.legNumber})`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right font-bold text-lg">{match.homeTeam.name}</div>
                      <div className="px-6 text-2xl font-black font-mono">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div className="flex-1 text-left font-bold text-lg">{match.awayTeam.name}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {data?.matches?.finished?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 opacity-75">
                  {data.matches.finished.map((match: any) => (
                    <div key={match.id} className="flex justify-between items-center p-3 border rounded-md text-sm">
                      <div className="flex-1 text-right font-medium">{match.homeTeam.name}</div>
                      <div className="px-4 font-bold">{match.homeScore} - {match.awayScore}</div>
                      <div className="flex-1 text-left font-medium">{match.awayTeam.name}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Points Table */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Points Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase border-b">
                      <tr>
                        <th className="pb-2">Team</th>
                        <th className="pb-2 text-center" title="Played">P</th>
                        <th className="pb-2 text-center" title="Goal Difference">GD</th>
                        <th className="pb-2 text-center font-bold" title="Points">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data?.standings?.map((row: any, idx: number) => (
                        <tr key={row.id}>
                          <td className="py-3 font-medium flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{idx + 1}</span>
                            {row.team.name}
                          </td>
                          <td className="py-3 text-center">{row.played}</td>
                          <td className="py-3 text-center">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                          <td className="py-3 text-center font-bold text-primary">{row.points}</td>
                        </tr>
                      ))}
                      {(!data?.standings || data.standings.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">No standings available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
