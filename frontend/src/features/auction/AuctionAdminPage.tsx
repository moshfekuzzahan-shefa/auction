import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocketContext } from '../../providers/SocketProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const AuctionAdminPage = () => {
  const { socket } = useSocketContext();
  const [auctionState, setAuctionState] = useState<any>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [basePriceOverride, setBasePriceOverride] = useState('');
  const [auctionMode, setAuctionMode] = useState('NORMAL');

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

  const handlePullPlayer = (overrideId?: string) => {
    const idToPull = overrideId || selectedPlayerId;
    if (!idToPull) {
      alert('Please select a player');
      return;
    }
    const player = unsoldPlayers?.find((p: any) => p.userId === idToPull);
    if (!player) {
      alert('Error: Player not found in unsold list.');
      return;
    }

    const basePrice = basePriceOverride ? Number(basePriceOverride) : player.category?.basePrice || 500;
    
    socket?.emit('PODIUM_PULL_PLAYER', { 
      playerId: idToPull, 
      mode: auctionMode, 
      basePrice 
    });
    
    // Refresh unsold list
    setTimeout(() => {
      refetch();
      refetchHistory();
      setSelectedPlayerId('');
    }, 1000);
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
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold">Podium Admin Controls</h1>

      <Card>
        <CardHeader>
          <CardTitle>Engine Status (Podium Drop Zone)</CardTitle>
        </CardHeader>
        <CardContent 
          className={`space-y-4 text-center transition-all ${auctionState?.status !== 'ACTIVE' && auctionState?.status !== 'PAUSED' ? 'border-2 border-dashed border-primary/50 min-h-[300px] flex flex-col justify-center rounded-xl bg-primary/5' : ''}`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="text-xl">Status: <span className="font-bold">{auctionState?.status || 'OFFLINE'}</span></div>
          {auctionState?.status === 'ACTIVE' || auctionState?.status === 'PAUSED' ? (
            <div className="space-y-4">
              {auctionState.currentPlayer && (
                <div className="text-2xl font-black text-primary mb-4">
                  {auctionState.currentPlayer.user?.name}
                </div>
              )}
              <div className="text-3xl font-mono text-destructive">{auctionState.timer}s</div>
              <div className="text-2xl">Current Bid: ${auctionState.currentBid}</div>
              <div className="text-lg">Leader: {auctionState.currentLeaderId || 'None'}</div>

              <div className="flex gap-4 justify-center mt-4">
                {auctionState.status === 'ACTIVE' ? (
                  <Button variant="outline" onClick={() => socket?.emit('OVERRIDE_PAUSE')}>Pause Timer</Button>
                ) : (
                  <Button variant="outline" onClick={() => socket?.emit('OVERRIDE_RESUME')}>Resume Timer</Button>
                )}
                <Button variant="destructive" onClick={() => {
                  socket?.emit('OVERRIDE_CANCEL');
                  setTimeout(() => refetch(), 1000);
                }}>Cancel Auction</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <p>No player is currently on the podium.</p>
              
              <div className="flex flex-col gap-3">
                <div className="text-muted-foreground italic mb-2">
                  Drag a player from the list below here, or select from the dropdown:
                </div>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                >
                  <option value="">Select a player...</option>
                  {unsoldPlayers?.map((player: any) => (
                    <option key={player.userId} value={player.userId}>
                      {player.user.name} ({player.primaryPos}) - {player.category?.name || 'No Category'}
                    </option>
                  ))}
                </select>

                <input 
                  type="number"
                  placeholder="Override Base Price (Optional)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={basePriceOverride}
                  onChange={(e) => setBasePriceOverride(e.target.value)}
                />

                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={auctionMode}
                  onChange={(e) => setAuctionMode(e.target.value)}
                >
                  <option value="NORMAL">NORMAL BIDDING</option>
                  <option value="BLIND">BLIND BIDDING</option>
                </select>

                <Button onClick={() => handlePullPlayer()} disabled={!selectedPlayerId}>
                  Pull to Podium
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales & Rollback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auctionHistory?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg bg-card">
                <div>
                  <p className="font-bold">{item.playerName}</p>
                  <p className="text-sm text-muted-foreground">Sold to {item.team.name} for ${item.amount}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to rollback this sale?')) {
                      socket?.emit('OVERRIDE_ROLLBACK', { ledgerId: item.id });
                      setTimeout(() => {
                        refetchHistory();
                        refetch();
                      }, 1000);
                    }
                  }}
                >
                  Rollback (Undo)
                </Button>
              </div>
            ))}
            {auctionHistory?.length === 0 && (
              <p className="text-muted-foreground">No recent sales.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered / Unsold Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {unsoldPlayers?.map((player: any) => (
              <div 
                key={player.userId}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('playerId', player.userId);
                }}
                onClick={() => setSelectedPlayerId(player.userId)}
                className={`relative group flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all ${selectedPlayerId === player.userId ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted mb-3 flex-shrink-0 border-2 border-background shadow-sm">
                  {player.publicId ? (
                    <img src={player.publicId} alt={player.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-muted-foreground flex h-full items-center justify-center">⚽</span>
                  )}
                </div>
                <h4 className="font-bold text-center text-sm mb-1">{player.user.name}</h4>
                <p className="text-xs text-muted-foreground text-center">{player.primaryPos}</p>
                <p className="text-xs font-semibold text-primary mt-1">${player.category?.basePrice || 500}</p>
                
                {/* Drag Hint Overlay */}
                <div className="absolute inset-0 bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity pointer-events-none">
                  <p className="text-sm font-bold text-center px-2">Drag to Podium</p>
                </div>
              </div>
            ))}
            {unsoldPlayers?.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                All players have been auctioned!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
