import { useEffect, useState } from 'react';
import { useSocketContext } from '../../providers/SocketProvider';
import { useAppSelector } from '../../store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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

    socket.on('SUCCESS', (msg) => alert(msg));
    socket.on('ERROR', (msg) => alert(msg));

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
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <h2 className="text-2xl font-bold">Waiting for next player...</h2>
      </div>
    );
  }

  // Use calculated values from backend, fallback if somehow missing
  const currentBid = auctionState.currentBid || 0;
  const nextValidBid = auctionState.nextValidBid || currentBid + 10;
  const minimumRaise = auctionState.minimumRaise || 10;

  const [customBid, setCustomBid] = useState<number>(nextValidBid);

  // Keep custom bid input synced with backend's nextValidBid when it updates
  useEffect(() => {
    if (auctionState?.nextValidBid && customBid < auctionState.nextValidBid) {
      setCustomBid(auctionState.nextValidBid);
    }
  }, [auctionState?.nextValidBid]);

  const handleCustomBidSubmit = () => {
    if (customBid < nextValidBid) {
      alert(`Bid must be at least $${nextValidBid}`);
      return;
    }
    placeBid(customBid);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Live Auction Room</h1>
        <div className="text-4xl font-mono font-bold text-destructive">
          00:{auctionState.timer?.toString().padStart(2, '0') || '00'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Player Card */}
        <Card className="border-border shadow-md">
          <CardHeader className="bg-muted/20 border-b">
            <CardTitle>On The Podium</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {auctionState.currentPlayer ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-xl overflow-hidden border-4 border-background shadow-lg">
                  {auctionState.currentPlayer.publicId ? (
                    <img src={auctionState.currentPlayer.publicId} alt={auctionState.currentPlayer.user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl text-muted-foreground opacity-50 flex h-full items-center justify-center">⚽</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{auctionState.currentPlayer.user?.name}</h3>
                  <p className="text-muted-foreground">{auctionState.currentPlayer.academicSession} | {auctionState.currentPlayer.studentId}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary font-semibold text-sm rounded-full">{auctionState.currentPlayer.category?.name}</span>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground font-semibold text-sm rounded-full">{auctionState.currentPlayer.primaryPos}</span>
                </div>
                <div className="text-sm font-mono text-muted-foreground pt-2">
                  Base Price: ${auctionState.currentPlayer.category?.basePrice}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="w-32 h-32 bg-muted rounded-full animate-pulse"></div>
                <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bidding Panel */}
        <Card className="flex flex-col justify-between border-primary shadow-lg">
          <CardHeader>
            <CardTitle>Current Bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="text-5xl font-extrabold text-primary">
              ${currentBid.toLocaleString()}
            </div>
            {auctionState.currentLeaderId ? (
              <p className="text-lg text-muted-foreground">Leader Team ID: {auctionState.currentLeaderId}</p>
            ) : (
              <p className="text-lg text-muted-foreground">Waiting for bids...</p>
            )}

            {user?.role === 'TEAM_MANAGER' && auctionState.status === 'ACTIVE' && (
              <div className="space-y-4 mt-8">
                <Button 
                  size="lg" 
                  className="w-full text-lg h-14" 
                  onClick={() => placeBid(nextValidBid)}
                >
                  Bid Next Valid (${nextValidBid.toLocaleString()})
                </Button>
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input 
                    type="number" 
                    value={customBid} 
                    onChange={(e) => setCustomBid(Number(e.target.value))} 
                    className="flex-1 h-12 px-4 rounded-md border border-input text-lg font-bold"
                    min={nextValidBid}
                    step={minimumRaise}
                  />
                  <Button 
                    variant="outline" 
                    className="h-12 px-8" 
                    onClick={handleCustomBidSubmit}
                  >
                    Place Custom Bid
                  </Button>
                </div>
              </div>
            )}
            
            {auctionState.status === 'PAUSED' && (
              <div className="p-4 bg-warning/20 text-warning font-bold rounded-lg animate-pulse mt-8">
                AUCTION PAUSED BY ADMIN
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
