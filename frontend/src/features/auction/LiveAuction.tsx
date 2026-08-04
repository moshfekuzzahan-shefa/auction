import { useEffect, useState } from 'react';
import { useSocketContext } from '../../providers/SocketProvider';
import { useAppSelector } from '../../store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trophy, ShieldAlert, ArrowUpRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuctionPodium } from '../../components/auction/AuctionPodium';

export const LiveAuction = () => {
  const { socket } = useSocketContext();
  const { user } = useAppSelector((state) => state.auth);
  const [auctionState, setAuctionState] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('JOIN_AUCTION_ROOM');

    const handleState = (state: any) => {
      setAuctionState(state);
    };

    const handleTick = ({ timer }: any) => {
      setAuctionState((prev: any) => prev ? { ...prev, timer } : null);
    };
    
    const handleBidPlaced = ({ teamId, amount }: any) => {
      setAuctionState((prev: any) => prev ? { ...prev, currentBid: amount, currentLeaderId: teamId } : null);
    };

    const handleSuccess = (msg: string) => toast.success(msg);
    const handleError = (msg: string) => toast.error(msg);

    const handleConnect = () => {
      socket.emit('JOIN_AUCTION_ROOM');
    };

    socket.on('AUCTION_STATE', handleState);
    socket.on('TIMER_TICK', handleTick);
    socket.on('BID_PLACED', handleBidPlaced);
    socket.on('SUCCESS', handleSuccess);
    socket.on('ERROR', handleError);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('AUCTION_STATE', handleState);
      socket.off('TIMER_TICK', handleTick);
      socket.off('BID_PLACED', handleBidPlaced);
      socket.off('SUCCESS', handleSuccess);
      socket.off('ERROR', handleError);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  const placeBid = (amount: number) => {
    if (socket) {
      socket.emit('PLACE_BID', { amount, teamId: myTeam?.id });
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

  const currentBid = auctionState.currentBid || 0;
  const nextValidBid = auctionState.nextValidBid || currentBid;
  const minRosterNeeded = auctionState.minRoster || 11;
  const lowestBasePrice = auctionState.lowestBasePrice || 250;

  const myTeam = auctionState.teams?.find((t: any) => t.managerId === user?.id);
  const currentBoughtCount = myTeam?._count?.players || 0;
  const remainingBudget = myTeam?.budget || 0;

  const remainingSlotsAfterThisPlayer = Math.max(0, minRosterNeeded - (currentBoughtCount + 1));
  const reserveNeeded = remainingSlotsAfterThisPlayer * lowestBasePrice;
  const maxAllowableBid = Math.max(0, remainingBudget - reserveNeeded);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      
      {/* TV-Broadcast Auction Podium */}
      <AuctionPodium 
        auctionState={auctionState} 
        teams={auctionState.teams} 
        userRole={user?.role}
        myTeam={myTeam}
        onPlaceBid={placeBid}
        isReadOnly={false}
      />

      {/* Team Manager Guardrails & Bidding Control Bar */}
      {user?.role === 'TEAM_MANAGER' && myTeam && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800 py-3">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center justify-between">
                <span>My Team Purse Guardrails</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Players Bought:</span>
                <span className="font-extrabold text-white">{currentBoughtCount} / {minRosterNeeded} Needed</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Remaining Purse:</span>
                <span className="font-extrabold text-emerald-400">${remainingBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Max Allowed Bid:</span>
                <span className="font-extrabold text-amber-400">${maxAllowableBid.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800 flex flex-col justify-center p-6 space-y-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-slate-400">Quick Bid Action</h3>
            <Button 
              size="lg" 
              onClick={() => placeBid(nextValidBid)}
              disabled={nextValidBid > maxAllowableBid || auctionState.status !== 'ACTIVE'}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 border border-emerald-400/30"
            >
              <span>
                Place Bid ({auctionState?.incrementType === 'FIXED' ? `+$${(auctionState?.incrementValue || 100).toLocaleString()}` : `+${auctionState?.incrementValue || 10}%`} / ${nextValidBid.toLocaleString()})
              </span>
              <ArrowUpRight className="w-5 h-5" />
            </Button>

            {nextValidBid > maxAllowableBid && (
              <div className="p-2.5 bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>Bid exceeds your Max Allowable Bid (${maxAllowableBid.toLocaleString()})!</span>
              </div>
            )}
          </Card>

        </div>
      )}

    </div>
  );
};
