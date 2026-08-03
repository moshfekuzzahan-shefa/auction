import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PlayerPitchPosition } from '../../components/ui/PlayerPitchPosition';
import { Search, LayoutGrid, List } from 'lucide-react';
import api from '../../services/api';

export const PlayerListAdminPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const { data: allPlayers, isLoading, isError } = useQuery({
    queryKey: ['players', 'all'],
    queryFn: async () => {
      const res = await api.get('/player/all');
      return res.data.data;
    }
  });

  const filteredPlayers = allPlayers?.filter((player: any) => {
    const query = searchQuery.toLowerCase();
    return (
      player.user.name.toLowerCase().includes(query) ||
      (player.studentId && player.studentId.toLowerCase().includes(query)) ||
      player.primaryPos.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load players directory.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Players Directory</h1>
          <p className="text-muted-foreground">Total Players: {allPlayers?.length || 0}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search players..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md border">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Grid
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <List className="h-4 w-4 mr-2" /> Table
            </Button>
          </div>
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p>No players found matching "{searchQuery}"</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player: any) => (
            <Card 
              key={player.userId} 
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden"
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5 relative">
                <PlayerPitchPosition position={player.primaryPos} compact className="absolute top-2 left-2 shadow-sm border-white/40" />
                {player.isSold && (
                   <div className="absolute top-2 right-2">
                     <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground backdrop-blur-sm shadow-sm border border-secondary/20">Sold</Badge>
                   </div>
                )}
                {!player.isSold && (
                   <div className="absolute top-2 right-2">
                     <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm">Unsold</Badge>
                   </div>
                )}
              </div>
              <CardContent className="pt-0 relative px-4 pb-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full border-4 border-background bg-background shadow-sm">
                  <Avatar 
                    src={player.imageUrl || player.publicId} 
                    alt={player.user.name} 
                    fallback={player.user.name.charAt(0)}
                    size="xl" 
                    className="w-20 h-20"
                  />
                </div>
                <div className="mt-12 text-center space-y-2">
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{player.user.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{player.jerseyName || 'No Jersey'} • {player.studentId}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Badge variant="default" className="text-xs">{player.primaryPos}</Badge>
                    {player.category && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {player.category.name} (${player.category.basePrice})
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Base Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player: any) => (
                  <tr 
                    key={player.userId} 
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={player.imageUrl || player.publicId} 
                          alt={player.user.name} 
                          fallback={player.user.name.charAt(0)}
                        />
                        <div>
                          <div className="font-bold">{player.user.name}</div>
                          <div className="text-xs text-muted-foreground">{player.jerseyName || 'No Jersey'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{player.user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{player.studentId || '-'}</td>
                    <td className="px-4 py-3 font-medium">{player.primaryPos}</td>
                    <td className="px-4 py-3">
                      {player.category ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {player.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">${player.category?.basePrice || 0}</td>
                    <td className="px-4 py-3">
                      {player.isSold ? (
                        <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-md text-xs font-bold border border-secondary/20">
                          Sold ({player.team?.name})
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs font-semibold border">
                          Unsold
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Player Detail Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
          {selectedPlayer && (
            <div className="flex flex-col">
              {/* Cover Image / Header area */}
              <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-background relative border-b">
                <div className="absolute -bottom-16 left-6 rounded-full border-4 border-background bg-background shadow-md">
                  <Avatar 
                    src={selectedPlayer.imageUrl || selectedPlayer.publicId} 
                    alt={selectedPlayer.user.name} 
                    fallback={selectedPlayer.user.name.charAt(0)}
                    className="w-32 h-32 text-4xl"
                  />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {selectedPlayer.isSold ? (
                    <Badge variant="secondary" className="px-3 py-1 text-sm shadow-sm">Sold to {selectedPlayer.team?.name}</Badge>
                  ) : (
                    <Badge variant="outline" className="px-3 py-1 text-sm shadow-sm bg-background/80 backdrop-blur-sm">Unsold</Badge>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="pt-20 pb-6 px-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPlayer.user.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{selectedPlayer.user.email}</span>
                    <span>•</span>
                    <span>ID: {selectedPlayer.studentId}</span>
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Pitch */}
                  <div className="flex justify-center items-center md:items-start shrink-0">
                    <PlayerPitchPosition position={selectedPlayer.primaryPos} />
                  </div>
                  
                  {/* Right Column: Stats */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Primary Position</p>
                        <p className="font-medium text-lg">{selectedPlayer.primaryPos}</p>
                      </div>
                      <div className="space-y-1 bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Jersey Name</p>
                        <p className="font-medium text-lg">{selectedPlayer.jerseyName || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Academic Session</p>
                        <p className="font-medium">{selectedPlayer.session || 'N/A'}</p>
                      </div>
                      <div className="space-y-1 bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Secondary Positions</p>
                        <p className="font-medium">
                          {selectedPlayer.secondaryPos?.length > 0 
                            ? selectedPlayer.secondaryPos.join(', ') 
                            : 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="font-semibold text-sm uppercase text-muted-foreground border-b pb-2">Auction Details</h3>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Category (Tier)</span>
                        <span className="font-medium">{selectedPlayer.category?.name || 'Uncategorized'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Base Price</span>
                        <span className="font-mono font-medium">${selectedPlayer.category?.basePrice || 0}</span>
                      </div>
                      {selectedPlayer.isSold && (
                        <div className="flex justify-between items-center py-1 text-primary">
                          <span className="font-semibold">Sold Price</span>
                          <span className="font-mono font-bold text-lg">${selectedPlayer.soldPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
