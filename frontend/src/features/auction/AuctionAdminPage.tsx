import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocketContext } from '../../providers/SocketProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, PlusCircle, Pause, Play, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export const AuctionAdminPage = () => {
  const { socket } = useSocketContext();
  const [auctionState, setAuctionState] = useState<any>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [basePriceOverride, setBasePriceOverride] = useState('');
  const [auctionMode, setAuctionMode] = useState('NORMAL');
  const [timerDuration, setTimerDuration] = useState('30');

  const { data: unsoldPlayers, refetch } = useQuery({
    queryKey: ['players', 'unsold'],
    queryFn: async () => {
      const res = await api.get('/player/unsold');
      return res.data.data;
    }
  });

  const { data: auctionHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['auction', 'history'],
    queryFn: async () => {
      const res = await api.get('/auction/history');
      return res.data.data;
    }
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

    socket.on('TIMER_EXTENDED', ({ addedSeconds, newTimer }) => {
      toast.info(`Timer extended by +${addedSeconds}s! (Now ${newTimer}s remaining)`);
    });

    socket.on('SUCCESS', (msg) => toast.success(msg));
    socket.on('ERROR', (msg) => toast.error(msg));

    const handleAuctionEnd = () => {
      refetch();
      refetchHistory();
    };
    socket.on('PLAYER_SOLD', handleAuctionEnd);
    socket.on('PLAYER_UNSOLD', handleAuctionEnd);

    return () => {
      socket.off('AUCTION_STATE');
      socket.off('TIMER_TICK');
      socket.off('BID_PLACED');
      socket.off('TIMER_EXTENDED');
      socket.off('SUCCESS');
      socket.off('ERROR');
      socket.off('PLAYER_SOLD', handleAuctionEnd);
      socket.off('PLAYER_UNSOLD', handleAuctionEnd);
    };
  }, [socket]);

  const handlePullPlayer = (overrideId?: string) => {
    const idToPull = overrideId || selectedPlayerId;
    if (!idToPull) {
      toast.error('Please select a player to pull onto the stage.');
      return;
    }
    const player = unsoldPlayers?.find((p: any) => p.userId === idToPull);
    if (!player) {
      toast.error('Error: Player not found in unsold pool.');
      return;
    }

    if (!player.categoryId && !basePriceOverride) {
      toast.error('Player has no Category/Base Price assigned! Please assign a category in Players Directory or override base price.');
      return;
    }

    const basePrice = basePriceOverride ? Number(basePriceOverride) : player.category?.basePrice;
    
    socket?.emit('PODIUM_PULL_PLAYER', { 
      playerId: idToPull, 
      mode: auctionMode, 
      basePrice,
      timerSeconds: Number(timerDuration) || 30
    });
    
    setTimeout(() => {
      refetch();
      refetchHistory();
      setSelectedPlayerId('');
    }, 1000);
  };

  const handleExtendTimer = (seconds: number) => {
    socket?.emit('EXTEND_TIMER', { seconds });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) {
      setSelectedPlayerId(playerId);
      handlePullPlayer(playerId);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Podium Admin Control Room</h1>
          <p className="text-sm text-slate-400">Manage live auction stage, timers, and player lots.</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Stage Online</span>
        </div>
      </div>

      <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-950/80 border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
            <span>Live Podium Stage</span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Status: <span className="text-emerald-400">{auctionState?.status || 'OFFLINE'}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent 
          className={`p-6 transition-all ${auctionState?.status !== 'ACTIVE' && auctionState?.status !== 'PAUSED' ? 'border-2 border-dashed border-slate-800 min-h-[300px] flex flex-col justify-center items-center rounded-2xl bg-slate-950/50' : ''}`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED' ? (
            <div className="space-y-6 text-center">
              {auctionState.currentPlayer && (
                <div className="inline-block px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-2xl font-black text-white">
                  {auctionState.currentPlayer.user?.name} ({auctionState.currentPlayer.primaryPos})
                </div>
              )}

              {/* Timer Display */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Countdown</span>
                <div className={`text-5xl font-mono font-black px-6 py-2 rounded-2xl border ${auctionState.timer <= 10 ? 'text-red-400 bg-red-950/40 border-red-800 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.4)]' : 'text-emerald-400 bg-slate-950 border-slate-800'}`}>
                  00:{auctionState.timer?.toString().padStart(2, '0') || '00'}
                </div>
              </div>

              <div className="flex justify-center items-center space-x-6 text-slate-300 text-sm">
                <div>Current Bid: <span className="font-extrabold text-emerald-400 text-xl">${auctionState.currentBid?.toLocaleString()}</span></div>
                <div>Leader: <span className="font-bold text-white">{auctionState.currentLeaderId || 'No bids placed'}</span></div>
              </div>

              {/* Live Timer Extension & Stage Controls */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                
                {/* Timer Extension Buttons */}
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Extend Time:
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => handleExtendTimer(10)} 
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700 rounded-xl"
                  >
                    +10 Seconds
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleExtendTimer(15)} 
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700 rounded-xl"
                  >
                    +15 Seconds
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleExtendTimer(30)} 
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700 rounded-xl"
                  >
                    +30 Seconds
                  </Button>
                </div>

                {/* Pause / Resume / Cancel Action Controls */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  {auctionState.status === 'ACTIVE' ? (
                    <Button 
                      onClick={() => socket?.emit('OVERRIDE_PAUSE')} 
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 flex items-center space-x-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause Countdown</span>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => socket?.emit('OVERRIDE_RESUME')} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6 flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Resume Countdown</span>
                    </Button>
                  )}

                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm('Cancel current auction lot?')) {
                        socket?.emit('OVERRIDE_CANCEL');
                        setTimeout(() => refetch(), 1000);
                      }
                    }}
                    className="bg-red-950/80 border border-red-800 hover:bg-red-900 text-red-200 font-bold rounded-xl px-6 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Auction</span>
                  </Button>
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto text-center">
              <div className="text-slate-400 text-sm">
                No player is currently on the stage. Drag a player card from below or configure options to pull:
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Select Player */}
                <div className="sm:col-span-2">
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                  >
                    <option value="">-- Select Player from Unsold Pool --</option>
                    {unsoldPlayers?.map((player: any) => (
                      <option key={player.userId} value={player.userId}>
                        {player.user.name} ({player.primaryPos}) - {player.category ? `${player.category.name} ($${player.category.basePrice})` : 'Pending Category'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Timer Duration */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timer Duration</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-emerald-500 font-bold"
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(e.target.value)}
                  >
                    <option value="15">15 Seconds (Rapid)</option>
                    <option value="30">30 Seconds (Standard)</option>
                    <option value="45">45 Seconds (Extended)</option>
                    <option value="60">60 Seconds (Marathon)</option>
                  </select>
                </div>

                {/* Optional Override Base Price */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Override Base Price ($)</label>
                  <input 
                    type="number"
                    placeholder="Optional Override"
                    className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    value={basePriceOverride}
                    onChange={(e) => setBasePriceOverride(e.target.value)}
                  />
                </div>

              </div>

              <Button 
                onClick={() => handlePullPlayer()} 
                disabled={!selectedPlayerId}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 text-base mt-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Pull Player to Stage</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales & Rollback */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="bg-slate-950/80 border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white">Recent Sales & Rollback Control</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {auctionHistory?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950">
                <div>
                  <p className="font-bold text-white text-sm">{item.playerName}</p>
                  <p className="text-xs text-slate-400">
                    Sold to <span className="text-emerald-400 font-semibold">{item.team.name}</span> for <span className="font-mono text-white font-bold">${item.amount.toLocaleString()}</span>
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to rollback sale of ${item.playerName}?`)) {
                      socket?.emit('OVERRIDE_ROLLBACK', { ledgerId: item.id });
                      setTimeout(() => {
                        refetchHistory();
                        refetch();
                      }, 1000);
                    }
                  }}
                  className="bg-red-950/80 border border-red-800 hover:bg-red-900 text-red-200 font-bold text-xs h-9 rounded-xl flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Rollback</span>
                </Button>
              </div>
            ))}
            {auctionHistory?.length === 0 && (
              <p className="text-slate-400 text-sm">No recent sales registered in ledger.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registered Unsold Players Pool */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="bg-slate-950/80 border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white">Registered Unsold Players Pool ({unsoldPlayers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {unsoldPlayers?.map((player: any) => (
              <div 
                key={player.userId}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('playerId', player.userId);
                }}
                onClick={() => setSelectedPlayerId(player.userId)}
                className={`relative group flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-grab active:cursor-grabbing hover:border-emerald-500 hover:shadow-lg transition-all ${selectedPlayerId === player.userId ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 mb-3 flex-shrink-0 border-2 border-slate-800 shadow-sm flex items-center justify-center">
                  {player.publicId ? (
                    <img src={player.publicId} alt={player.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-40">⚽</span>
                  )}
                </div>
                <h4 className="font-bold text-center text-sm text-white mb-0.5 line-clamp-1">{player.user.name}</h4>
                <p className="text-xs text-slate-400 text-center">{player.primaryPos}</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                  ${player.category?.basePrice || 'Unassigned'}
                </p>
                
                {/* Drag Overlay */}
                <div className="absolute inset-0 bg-emerald-950/90 text-emerald-300 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity pointer-events-none border border-emerald-500">
                  <p className="text-xs font-bold text-center px-2">Click or Drag to Stage</p>
                </div>
              </div>
            ))}
            {unsoldPlayers?.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-400">
                All players have been auctioned!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
