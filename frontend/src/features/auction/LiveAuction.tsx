import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../providers/SocketProvider';
import { useAppSelector } from '../../store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trophy, ShieldAlert, ArrowUpRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuctionPodium } from '../../components/auction/AuctionPodium';
import { PurseGuardrails } from '../../components/auction/PurseGuardrails';
import { useCallback } from 'react';

export const LiveAuction = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();
  const { user } = useAppSelector((state) => state.auth);
  const [auctionState, setAuctionState] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('JOIN_AUCTION_ROOM');

    const handleState = (state: any) => {
      setAuctionState(state);
    };
    
    const handleBidPlaced = ({ teamId, amount }: any) => {
      setAuctionState((prev: any) => prev ? { ...prev, currentBid: amount, currentLeaderId: teamId } : null);
    };

    const handleSuccess = (msg: string) => toast.success(msg);
    const handleError = (msg: string) => toast.error(msg);

    const handlePlayerSold = ({ winnerName, finalAmount, playerName }: any) => {
      toast.success(`🎉 ${playerName} SOLD to ${winnerName} for $${finalAmount.toLocaleString()}!`, {
        duration: 5000,
        style: { background: '#059669', color: 'white', border: 'none' }
      });
      queryClient.invalidateQueries({ queryKey: ['auction', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['players', 'unsold'] });
      queryClient.invalidateQueries({ queryKey: ['team'] }); // for TeamDashboard roster
    };

    const handlePlayerUnsold = ({ playerName }: any) => {
      toast.info(`⚠️ ${playerName} remained UNSOLD!`, {
        duration: 4000
      });
      queryClient.invalidateQueries({ queryKey: ['players', 'unsold'] });
    };

    const handleConnect = () => {
      socket.emit('JOIN_AUCTION_ROOM');
    };

    socket.on('AUCTION_STATE', handleState);
    socket.on('BID_PLACED', handleBidPlaced);
    socket.on('PLAYER_SOLD', handlePlayerSold);
    socket.on('PLAYER_UNSOLD', handlePlayerUnsold);
    socket.on('SUCCESS', handleSuccess);
    socket.on('ERROR', handleError);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('AUCTION_STATE', handleState);
      socket.off('BID_PLACED', handleBidPlaced);
      socket.off('PLAYER_SOLD', handlePlayerSold);
      socket.off('PLAYER_UNSOLD', handlePlayerUnsold);
      socket.off('SUCCESS', handleSuccess);
      socket.off('ERROR', handleError);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  const myTeam = auctionState?.teams?.find((t: any) => t.managerId === user?.id);

  const placeBid = useCallback((amount: number) => {
    if (socket) {
      socket.emit('PLACE_BID', { amount, teamId: myTeam?.id });
    }
  }, [socket, myTeam?.id]);

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
        <PurseGuardrails
          currentBoughtCount={currentBoughtCount}
          minRosterNeeded={minRosterNeeded}
          remainingBudget={remainingBudget}
          maxAllowableBid={maxAllowableBid}
          nextValidBid={nextValidBid}
          auctionStateStatus={auctionState.status}
          incrementType={auctionState.incrementType}
          incrementValue={auctionState.incrementValue}
          onPlaceBid={placeBid}
        />
      )}

    </div>
  );
};
