import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Gavel, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocketContext } from '../../../providers/SocketProvider';
import { CountdownTimer } from '../../../components/ui/CountdownTimer';
import api from '../../../services/api';

interface LiveAuctionPublicPodiumProps {
  message?: string;
  data: any;
  schedule?: {
    registrationStart?: string;
    registrationEnd?: string;
    auctionStart?: string;
    auctionEnd?: string;
  };
  isReadOnly?: boolean;
}

export const LiveAuctionPublicPodium = ({ message, data, schedule }: LiveAuctionPublicPodiumProps) => {
  const { socket } = useSocketContext();
  const [auctionState, setAuctionState] = useState<any>(null);

  const { data: unsoldPlayers } = useQuery({
    queryKey: ['players', 'unsold'],
    queryFn: async () => {
      const res = await api.get('/player/unsold');
      return res.data.data;
    },
    // Poll every 10 seconds to keep the list fresh as players are sold
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!socket) return;
    
    socket.emit('JOIN_AUCTION_ROOM');

    socket.on('AUCTION_STATE', (state) => {
      setAuctionState(state);
    });

    socket.on('TIMER_TICK', ({ timer }) => {
      setAuctionState((prev: any) => prev ? { ...prev, timer } : null);
    });
    
    socket.on('BID_PLACED', ({ teamId, amount }) => {
      setAuctionState((prev: any) => prev ? { ...prev, currentBid: amount, currentLeaderId: teamId } : null);
    });

    return () => {
      socket.off('AUCTION_STATE');
      socket.off('TIMER_TICK');
      socket.off('BID_PLACED');
    };
  }, [socket]);

  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <Badge variant="destructive" className="animate-pulse px-4 py-1.5 text-sm uppercase tracking-widest">
          <Activity className="w-4 h-4 mr-2 inline-block" /> Live Now
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight">The Auction is Live!</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          {message || "Franchise owners are currently bidding on players in real-time."}
        </p>
      </div>

      {schedule?.auctionEnd && new Date(schedule.auctionEnd) > new Date() && (
        <div className="w-full flex justify-center mb-8">
          <CountdownTimer targetDate={schedule.auctionEnd} label="Live Auction Ends In" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left/Top: Podium View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-destructive"></div>
            <CardHeader className="bg-muted/30 pb-8">
              <CardTitle className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                Live Podium
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 text-center min-h-[300px] flex flex-col justify-center items-center space-y-4">
              {auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED' ? (
                <div className="w-full flex flex-col items-center">
                  {auctionState.currentPlayer ? (
                    <div className="w-full flex flex-col md:flex-row gap-8 items-center md:items-start text-left bg-background rounded-xl p-6 border shadow-sm relative overflow-hidden">
                      {/* Decorative Background for Category */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10"></div>
                      
                      {/* Player Image */}
                      <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-muted flex-shrink-0 bg-muted flex justify-center items-center">
                        {auctionState.currentPlayer.publicId ? (
                           <img src={auctionState.currentPlayer.publicId} alt={auctionState.currentPlayer.user?.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-6xl text-muted-foreground opacity-50">⚽</span>
                        )}
                      </div>

                      {/* Player Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-3xl font-black">{auctionState.currentPlayer.user?.name}</h3>
                          <p className="text-muted-foreground">{auctionState.currentPlayer.academicSession} | {auctionState.currentPlayer.studentId}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" className="text-sm bg-primary/20 text-primary border-primary/20">{auctionState.currentPlayer.category?.name}</Badge>
                          <Badge variant="secondary" className="text-sm">{auctionState.currentPlayer.primaryPos}</Badge>
                          <Badge variant="outline" className="text-sm font-mono">Base: ${auctionState.currentPlayer.category?.basePrice}</Badge>
                        </div>

                        <div className="pt-4 border-t w-full flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Highest Bid</p>
                            <p className="text-4xl font-black text-primary">${auctionState.currentBid.toLocaleString()}</p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">Leader: {auctionState.currentLeaderId || 'No bids yet'}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Time Remaining</div>
                             <div className="text-4xl font-mono font-black text-destructive tabular-nums bg-destructive/10 px-4 py-1 rounded-lg border border-destructive/20 inline-block">
                               00:{auctionState.timer?.toString().padStart(2, '0') || '00'}
                             </div>
                             {auctionState.status === 'PAUSED' && <p className="text-sm text-warning mt-2 font-bold animate-pulse">PAUSED</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-4xl font-black animate-pulse py-12">Loading Profile...</h3>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-12">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-border">
                    <Gavel className="w-10 h-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-3xl font-bold text-muted-foreground">Waiting for next player...</h3>
                  <p className="text-lg text-muted-foreground">The auctioneer is preparing the next lot.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right/Bottom: Teams Status */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Franchises</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.teams && data.teams.length > 0 ? (
                <div className="space-y-4">
                  {data.teams.map((team: any) => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground overflow-hidden">
                          {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" /> : team.name.charAt(0)}
                        </div>
                        <div className="font-medium truncate max-w-[120px]">{team.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase">Budget</div>
                        <div className="font-bold font-mono text-primary">{team.budget}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Teams data unavailable.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Upcoming / Unsold Players */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight">Upcoming Players</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {unsoldPlayers?.filter((p: any) => p.userId !== auctionState?.currentPlayer?.userId).map((player: any) => (
            <div key={player.userId} className="flex flex-col items-center p-3 border rounded-xl bg-card shadow-sm opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted mb-2 border-2 border-background shadow-sm flex-shrink-0">
                {player.publicId ? (
                  <img src={player.publicId} alt={player.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl flex h-full items-center justify-center">⚽</span>
                )}
              </div>
              <h4 className="font-bold text-center text-xs line-clamp-1 w-full" title={player.user.name}>{player.user.name}</h4>
              <p className="text-[10px] text-muted-foreground">{player.primaryPos} • ${player.category?.basePrice || 500}</p>
            </div>
          ))}
          {unsoldPlayers?.length === 0 && (
            <p className="text-muted-foreground col-span-full">No more players available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
