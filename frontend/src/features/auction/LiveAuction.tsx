import { useEffect, useState } from 'react';
import { useSocketContext } from '../../providers/SocketProvider';
import { useAppSelector } from '../../store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trophy, ShieldAlert, ArrowUpRight, CheckCircle2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const LiveAuction = () => {
  const { socket } = useSocketContext();
  const { user } = useAppSelector((state) => state.auth);
  const [auctionState, setAuctionState] = useState<any>(null);

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

    socket.on('SUCCESS', (msg) => toast.success(msg));
    socket.on('ERROR', (msg) => toast.error(msg));

    return () => {
      socket.off('AUCTION_STATE');
      socket.off('TIMER_TICK');
      socket.off('BID_PLACED');
      socket.off('SUCCESS');
      socket.off('ERROR');
    };
  }, [socket]);

  const placeBid = (amount: number) => {
    if (socket) {
      socket.emit('PLACE_BID', { amount });
    }
  };

  if (!auctionState || auctionState.status === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl mb-2">
          ⚽
        </div>
        <h2 className="text-2xl font-bold text-white">Waiting for next player on podium...</h2>
        <p className="text-slate-400 text-sm max-w-md">
          The auctioneer will pull the next available player onto the stage shortly. Stay tuned!
        </p>
      </div>
    );
  }

  // Calculated values from backend
  const currentBid = auctionState.currentBid || 0;
  const nextValidBid = auctionState.nextValidBid || currentBid;
  const minimumRaise = auctionState.minimumRaise || 0;
  const minRosterNeeded = auctionState.minRoster || 11;
  const lowestBasePrice = auctionState.lowestBasePrice || 250;

  // Find current Team Manager's team info from backend payload
  const myTeam = auctionState.teams?.find((t: any) => t.managerId === user?.id);
  const currentBoughtCount = myTeam?._count?.players || 0;
  const remainingBudget = myTeam?.budget || 0;

  // Calculate Guardrails for UI display
  const remainingSlotsAfterThisPlayer = Math.max(0, minRosterNeeded - (currentBoughtCount + 1));
  const reserveNeeded = remainingSlotsAfterThisPlayer * lowestBasePrice;
  const maxAllowableBid = Math.max(0, remainingBudget - reserveNeeded);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      
      {/* Top Header & Live Timer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE STAGE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Franchise Auction Room</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Timer</span>
            <div className="text-3xl font-mono font-black text-emerald-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
              00:{auctionState.timer?.toString().padStart(2, '0') || '00'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player Podium Card (7 cols) */}
        <Card className="lg:col-span-7 bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-950/80 border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
              <span>On The Podium</span>
              {auctionState.currentPlayer?.category && (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                  {auctionState.currentPlayer.category.name} Tier
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {auctionState.currentPlayer ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shrink-0 flex items-center justify-center">
                  {auctionState.currentPlayer.publicId ? (
                    <img src={auctionState.currentPlayer.publicId} alt={auctionState.currentPlayer.user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl opacity-40">⚽</span>
                  )}
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div>
                    <h3 className="text-2xl font-black text-white">{auctionState.currentPlayer.user?.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Session: {auctionState.currentPlayer.academicSession} | ID: {auctionState.currentPlayer.studentId}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-emerald-300 font-bold text-xs rounded-lg">
                      Jersey: {auctionState.currentPlayer.jerseyName || 'N/A'}
                    </span>
                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-teal-300 font-bold text-xs rounded-lg">
                      Position: {auctionState.currentPlayer.primaryPos}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="text-slate-400 font-semibold">Category Base Price: </span>
                    <span className="font-extrabold text-emerald-400">${auctionState.currentPlayer.category?.basePrice || auctionState.currentPlayer.basePrice}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 space-y-4">
                <div className="w-24 h-24 bg-slate-950 rounded-full animate-pulse" />
                <div className="h-4 w-40 bg-slate-950 rounded animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Bidding Controls & Guardrails (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Current Bid Display */}
          <Card className="bg-slate-900/90 border-emerald-500/30 shadow-2xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Current Highest Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                ${currentBid.toLocaleString()}
              </div>

              {auctionState.currentLeaderId ? (
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Leader: {auctionState.teams?.find((t: any) => t.id === auctionState.currentLeaderId)?.name || 'Team Leader'}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">No bids placed yet. Starting at Base Price.</p>
              )}

              {/* Bidding Button for Team Manager */}
              {user?.role === 'TEAM_MANAGER' && auctionState.status === 'ACTIVE' && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <Button 
                    size="lg" 
                    onClick={() => placeBid(nextValidBid)}
                    disabled={nextValidBid > maxAllowableBid}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2"
                  >
                    <span>Place Bid (+10% / ${nextValidBid.toLocaleString()})</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>

                  {nextValidBid > maxAllowableBid && (
                    <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-semibold rounded-xl flex items-center space-x-2 text-left">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                      <span>Bid exceeds your Max Allowable Bid ($${maxAllowableBid.toLocaleString()})!</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Roster & Budget Guardrails Card */}
          {user?.role === 'TEAM_MANAGER' && myTeam && (
            <Card className="bg-slate-900/90 border-slate-800">
              <CardHeader className="bg-slate-950/80 border-b border-slate-800 py-3">
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center justify-between">
                  <span>My Roster & Purse Guardrails</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                
                {/* Roster Counter */}
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium">Players Bought:</span>
                  <span className="font-extrabold text-white">
                    {currentBoughtCount} / {minRosterNeeded} Needed
                  </span>
                </div>

                {/* Remaining Purse */}
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium">Remaining Purse:</span>
                  <span className="font-extrabold text-emerald-400">${remainingBudget.toLocaleString()}</span>
                </div>

                {/* Max Allowable Bid */}
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium">Max Allowed Bid:</span>
                  <span className="font-extrabold text-amber-400">${maxAllowableBid.toLocaleString()}</span>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
};
