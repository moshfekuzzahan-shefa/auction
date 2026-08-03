import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Gavel, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocketContext } from '../../../providers/SocketProvider';
import { CountdownTimer } from '../../../components/ui/CountdownTimer';
import { getCategoryTheme } from '../../../utils/categoryTheme';
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

  const activeCategoryTheme = getCategoryTheme(auctionState?.currentPlayer?.category?.name);

  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <Badge variant="destructive" className="animate-pulse px-4 py-1.5 text-sm uppercase tracking-widest">
          <Activity className="w-4 h-4 mr-2 inline-block" /> Live Now
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-white">The Auction is Live!</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
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
          <Card className={`border shadow-2xl overflow-hidden relative transition-all duration-500 bg-gradient-to-br ${activeCategoryTheme.bgGradient} ${activeCategoryTheme.border} ${activeCategoryTheme.glow}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-500"></div>
            <CardHeader className="bg-slate-950/60 pb-6 border-b border-slate-800/80">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-emerald-400" />
                  <span>Live Podium Stage</span>
                </div>
                {auctionState?.currentPlayer?.category && (
                  <Badge variant="outline" className={`${activeCategoryTheme.badge} font-bold px-3 py-1 text-xs shadow-sm`}>
                    {auctionState.currentPlayer.category.name} Tier
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 text-center min-h-[300px] flex flex-col justify-center items-center space-y-4">
              {auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED' ? (
                <div className="w-full flex flex-col items-center">
                  {auctionState.currentPlayer ? (
                    <div className="w-full flex flex-col md:flex-row gap-8 items-center md:items-start text-left bg-slate-950/70 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                      
                      {/* Player Image */}
                      <div className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 ${activeCategoryTheme.border} ${activeCategoryTheme.glow} flex-shrink-0 bg-slate-900 flex justify-center items-center shadow-2xl`}>
                        {auctionState.currentPlayer.publicId ? (
                           <img src={auctionState.currentPlayer.publicId} alt={auctionState.currentPlayer.user?.name} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-6xl opacity-40">⚽</span>
                        )}
                      </div>

                      {/* Player Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-3xl font-black text-white">{auctionState.currentPlayer.user?.name}</h3>
                          <p className="text-slate-400 text-sm mt-0.5">
                            {auctionState.currentPlayer.academicSession} | ID: {auctionState.currentPlayer.studentId}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={`${activeCategoryTheme.badge} font-bold text-xs`}>
                            {auctionState.currentPlayer.category?.name || 'Unassigned'} Tier
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs">
                            {auctionState.currentPlayer.primaryPos}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-950 text-emerald-400 border-slate-800 font-mono font-bold text-xs">
                            Base: ${auctionState.currentPlayer.category?.basePrice || auctionState.currentPlayer.basePrice}
                          </Badge>
                        </div>

                        <div className="pt-4 border-t border-slate-800/80 w-full flex justify-between items-center">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Highest Bid</p>
                            <p className={`text-4xl font-black ${activeCategoryTheme.accentText}`}>
                              ${auctionState.currentBid.toLocaleString()}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-1">
                              Leader: {auctionState.currentLeaderId ? (data?.teams?.find((t: any) => t.id === auctionState.currentLeaderId)?.name || 'Team Leader') : 'No bids placed yet'}
                            </p>
                          </div>
                          <div className="text-right">
                             <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Time Remaining</div>
                             <div className="text-4xl font-mono font-black text-emerald-400 tabular-nums bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 inline-block shadow-inner">
                               00:{auctionState.timer?.toString().padStart(2, '0') || '00'}
                             </div>
                             {auctionState.status === 'PAUSED' && (
                               <p className="text-xs text-amber-400 mt-2 font-bold animate-pulse">PAUSED BY ADMIN</p>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-4xl font-black animate-pulse py-12 text-slate-400">Loading Profile...</h3>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-12">
                  <div className="w-24 h-24 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-800">
                    <Gavel className="w-10 h-10 text-slate-500 opacity-60" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-300">Waiting for next player...</h3>
                  <p className="text-sm text-slate-400">The auctioneer is preparing the next lot for the live stage.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right/Bottom: Teams Status */}
        <div className="space-y-6">
          <Card className="h-full bg-slate-900/90 border-slate-800">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white">Franchises & Purses</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data?.teams && data.teams.length > 0 ? (
                <div className="space-y-3">
                  {data.teams.map((team: any) => (
                    <div key={team.id} className="flex items-center justify-between p-3 border border-slate-800 rounded-xl bg-slate-950">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-emerald-400 overflow-hidden">
                          {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" /> : team.name.charAt(0)}
                        </div>
                        <div className="font-bold text-white text-sm truncate max-w-[120px]">{team.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Purse</div>
                        <div className="font-bold font-mono text-emerald-400 text-sm">${team.budget.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Teams data loading...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Upcoming / Unsold Players */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight text-white">Upcoming Auction Pool</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {unsoldPlayers?.filter((p: any) => p.userId !== auctionState?.currentPlayer?.userId).map((player: any) => {
            const pTheme = getCategoryTheme(player.category?.name);
            return (
              <div 
                key={player.userId} 
                className={`flex flex-col items-center p-3 border rounded-2xl bg-gradient-to-br ${pTheme.bgGradient} ${pTheme.border} ${pTheme.glow} shadow-md opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 mb-2 border-2 border-white/20 shadow-md flex-shrink-0 flex items-center justify-center">
                  {player.publicId ? (
                    <img src={player.publicId} alt={player.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl opacity-40">⚽</span>
                  )}
                </div>
                <h4 className="font-bold text-center text-xs text-white line-clamp-1 w-full" title={player.user.name}>{player.user.name}</h4>
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pTheme.badge}`}>
                    {player.category?.name || 'Unassigned'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-1">{player.primaryPos} • ${player.category?.basePrice || 250}</p>
              </div>
            );
          })}
          {unsoldPlayers?.length === 0 && (
            <p className="text-slate-400 col-span-full">No more players available in pool.</p>
          )}
        </div>
      </div>
    </div>
  );
};
