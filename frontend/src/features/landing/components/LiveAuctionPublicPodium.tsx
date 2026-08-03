import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Activity, Crown, Trophy, ShieldAlert, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocketContext } from '../../../providers/SocketProvider';
import { CountdownTimer } from '../../../components/ui/CountdownTimer';
import { AuctionPodium } from '../../../components/auction/AuctionPodium';
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

  // Teams list merge & real-time sorting
  const rawTeams = auctionState?.teams || data?.teams || [];
  const activeLeaderId = auctionState?.currentLeaderId;
  const minRoster = auctionState?.minRoster || 11;
  const lowestBasePrice = auctionState?.lowestBasePrice || 250;
  const nextValidBid = auctionState?.nextValidBid || auctionState?.currentBid || 500;

  const sortedTeams = [...rawTeams].sort((a: any, b: any) => {
    if (a.id === activeLeaderId) return -1;
    if (b.id === activeLeaderId) return 1;
    const countA = a._count?.players ?? a.players?.length ?? 0;
    const countB = b._count?.players ?? b.players?.length ?? 0;
    if (countB !== countA) return countB - countA;
    return a.budget - b.budget;
  });

  const getCategoryCounts = (team: any) => {
    const players = team.players || [];
    let pt = 0, au = 0, ag = 0, cu = 0;
    players.forEach((p: any) => {
      const catName = (p.category?.name || '').toLowerCase();
      if (catName.includes('platinum')) pt++;
      else if (catName.includes('gold')) au++;
      else if (catName.includes('silver')) ag++;
      else if (catName.includes('bronze')) cu++;
    });
    return { pt, au, ag, cu };
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
      <div className="text-center space-y-3">
        <Badge variant="destructive" className="animate-pulse px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-red-600 border border-red-400">
          <Activity className="w-4 h-4 mr-2 inline-block" /> Live Broadcast Mode
        </Badge>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">IPL & FUT Style Live Auction Podium</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          {message || "Real-time bids, tactical radar stats, and broadcast telemetry stream."}
        </p>
      </div>

      {schedule?.auctionEnd && new Date(schedule.auctionEnd) > new Date() && (
        <div className="w-full flex justify-center mb-6">
          <CountdownTimer targetDate={schedule.auctionEnd} label="Live Auction Ends In" />
        </div>
      )}

      {/* Main Broadcast Split Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left/Top: High-Impact TV-Broadcast Podium (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <AuctionPodium 
            auctionState={auctionState} 
            teams={rawTeams} 
            isReadOnly={true} 
          />
        </div>

        {/* Right: Dynamic Live Team Leaderboard Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="h-full bg-slate-900/90 border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-950/90 border-b border-slate-800 py-4">
              <CardTitle className="text-lg font-extrabold text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Franchise Leaderboard</span>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase tracking-wider font-extrabold">
                  Phase 3 Live
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4">
              {sortedTeams.length > 0 ? (
                <div className="space-y-3">
                  {sortedTeams.map((team: any, index: number) => {
                    const isCurrentLeader = team.id === activeLeaderId;
                    const boughtCount = team._count?.players ?? team.players?.length ?? 0;
                    const counts = getCategoryCounts(team);
                    
                    const remainingSlotsNeeded = Math.max(0, minRoster - (boughtCount + 1));
                    const reserveNeeded = remainingSlotsNeeded * lowestBasePrice;
                    const maxAllowableBid = Math.max(0, team.budget - reserveNeeded);
                    const isBudgetLocked = team.budget < nextValidBid || nextValidBid > maxAllowableBid;
                    const rosterPercentage = Math.min(100, Math.round((boughtCount / minRoster) * 100));

                    return (
                      <div 
                        key={team.id} 
                        className={`p-3.5 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                          isCurrentLeader
                            ? 'bg-slate-950 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {isCurrentLeader && (
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
                        )}

                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                              {isCurrentLeader ? (
                                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                              ) : (
                                `#${index + 1}`
                              )}
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-emerald-400 overflow-hidden shrink-0 shadow-sm">
                              {team.logoUrl ? (
                                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                              ) : (
                                team.name.charAt(0)
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-white text-sm truncate max-w-[130px]">{team.name}</h4>
                                {isCurrentLeader && (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-extrabold px-1.5 py-0.5">
                                    TOP BIDDER
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center"><Users className="w-3 h-3 mr-1 text-slate-500" /> {boughtCount}/{minRoster} Players</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-end">
                              <Wallet className="w-3 h-3 mr-1 text-slate-500" /> Purse
                            </div>
                            <div className="font-extrabold font-mono text-emerald-400 text-sm">
                              ${team.budget.toLocaleString()}
                            </div>
                            {isBudgetLocked && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800 text-[9px] font-extrabold flex items-center inline-flex">
                                  <ShieldAlert className="w-2.5 h-2.5 mr-0.5 shrink-0" /> Budget Locked
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2 border border-slate-800/50">
                          <div 
                            className={`h-full transition-all duration-500 ${isCurrentLeader ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-emerald-600'}`}
                            style={{ width: `${rosterPercentage}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Squad Tiers:</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-bold">
                            Pt: {counts.pt}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-bold">
                            Au: {counts.au}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold">
                            Ag: {counts.ag}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-950/60 border border-orange-800/60 text-orange-300 text-[10px] font-bold">
                            Cu: {counts.cu}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">Franchise teams loading...</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Bottom: Upcoming / Unsold Players */}
      <div className="space-y-4 pt-4">
        <h3 className="text-2xl font-black tracking-tight text-white">Upcoming Auction Pool</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {unsoldPlayers?.filter((p: any) => p.userId !== auctionState?.currentPlayer?.userId).map((player: any) => (
            <div 
              key={player.userId} 
              className="flex flex-col items-center p-3 border border-slate-800 rounded-2xl bg-slate-900/80 shadow-md opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 mb-2 border-2 border-slate-700 shadow-md flex-shrink-0 flex items-center justify-center">
                {player.publicId ? (
                  <img src={player.publicId} alt={player.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl opacity-40">⚽</span>
                )}
              </div>
              <h4 className="font-bold text-center text-xs text-white line-clamp-1 w-full" title={player.user.name}>{player.user.name}</h4>
              <p className="text-[10px] font-mono text-emerald-400 mt-1">{player.primaryPos} • ${player.category?.basePrice || 250}</p>
            </div>
          ))}
          {unsoldPlayers?.length === 0 && (
            <p className="text-slate-400 col-span-full">No more players available in pool.</p>
          )}
        </div>
      </div>

    </div>
  );
};
