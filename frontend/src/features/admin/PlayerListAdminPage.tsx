import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/Card';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PlayerPitchPosition } from '../../components/ui/PlayerPitchPosition';
import { Search, LayoutGrid, List, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';
import api from '../../services/api';

export const PlayerListAdminPage = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Editable fields in modal
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editPrimaryPos, setEditPrimaryPos] = useState<string>('');

  const { data: allPlayers, isLoading, isError } = useQuery({
    queryKey: ['players', 'all'],
    queryFn: async () => {
      const res = await api.get('/player/all');
      return res.data.data;
    }
  });

  const { data: publicConfig } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  const categories = publicConfig?.categories || [
    { id: 'c1', name: 'Platinum', basePrice: 1000 },
    { id: 'c2', name: 'Gold', basePrice: 750 },
    { id: 'c3', name: 'Silver', basePrice: 500 },
    { id: 'c4', name: 'Bronze', basePrice: 250 },
  ];

  const positions = publicConfig?.positions || [
    { id: 'p1', code: 'GK', name: 'Goalkeeper' },
    { id: 'p2', code: 'CB', name: 'Center Back' },
    { id: 'p3', code: 'LB', name: 'Left Back' },
    { id: 'p4', code: 'RB', name: 'Right Back' },
    { id: 'p5', code: 'CM', name: 'Central Midfielder' },
    { id: 'p6', code: 'CAM', name: 'Attacking Midfielder' },
    { id: 'p7', code: 'LW', name: 'Left Wing' },
    { id: 'p8', code: 'RW', name: 'Right Wing' },
    { id: 'p9', code: 'ST', name: 'Striker' },
  ];

  useEffect(() => {
    if (selectedPlayer) {
      setEditCategoryId(selectedPlayer.categoryId || selectedPlayer.category?.id || '');
      setEditPrimaryPos(selectedPlayer.primaryPos || 'CM');
    }
  }, [selectedPlayer]);

  const updatePlayerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/player/admin/${selectedPlayer.id}`, {
        categoryId: editCategoryId || null,
        primaryPos: editPrimaryPos,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Player scouting details & category updated!');
      queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
      if (selectedPlayer) {
        setSelectedPlayer((prev: any) => prev ? { 
          ...prev, 
          categoryId: editCategoryId, 
          category: categories.find((c: any) => c.id === editCategoryId) || null,
          primaryPos: editPrimaryPos 
        } : null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update player category');
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
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
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
          <h1 className="text-3xl font-bold">Players Directory & Scouting</h1>
          <p className="text-muted-foreground">Total Registered Players: {allPlayers?.length || 0}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or position..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md border">
            <Button 
              variant={viewMode === 'grid' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Grid
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'primary' : 'ghost'} 
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
              key={player.id || player.userId} 
              className="cursor-pointer hover:border-emerald-500/50 hover:shadow-lg transition-all group overflow-hidden bg-slate-900/90 border-slate-800"
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="h-24 bg-gradient-to-r from-slate-950 to-slate-900 relative border-b border-slate-800">
                <PlayerPitchPosition position={player.primaryPos} compact className="absolute top-2 left-2 shadow-sm border-white/40" />
                
                {/* Category Badge */}
                {player.category ? (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold text-xs">
                      {player.category.name} (${player.category.basePrice})
                    </Badge>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                      Pending Category
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="pt-0 relative px-4 pb-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full border-4 border-slate-900 bg-slate-950 shadow-md">
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
                    <h3 className="font-bold text-lg text-white leading-tight group-hover:text-emerald-400 transition-colors">
                      {player.user.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{player.jerseyName || 'No Jersey'} • {player.studentId}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Badge variant="default" className="text-xs bg-slate-800 text-slate-200">{player.primaryPos}</Badge>
                    {player.isSold && (
                      <Badge variant="secondary" className="bg-emerald-950 text-emerald-300 border-emerald-800 text-xs">
                        Sold ({player.team?.name})
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900/90 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800">
                {filteredPlayers.map((player: any) => (
                  <tr 
                    key={player.id || player.userId} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
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
                          <div className="font-bold text-white">{player.user.name}</div>
                          <div className="text-xs text-slate-400">{player.jerseyName || 'No Jersey'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{player.user.email}</td>
                    <td className="px-4 py-3 text-slate-400">{player.studentId || '-'}</td>
                    <td className="px-4 py-3 font-medium text-emerald-400">{player.primaryPos}</td>
                    <td className="px-4 py-3">
                      {player.category ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
                          {player.category.name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
                          Pending Assignment
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-white">${player.category?.basePrice || '-'}</td>
                    <td className="px-4 py-3">
                      {player.isSold ? (
                        <span className="px-2 py-1 bg-emerald-950 text-emerald-300 rounded-md text-xs font-bold border border-emerald-800">
                          Sold ({player.team?.name})
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-semibold">
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

      {/* Admin Scouting & Category Assignment Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-900 border-slate-800 text-white">
          {selectedPlayer && (
            <div className="flex flex-col">
              
              {/* Header Banner */}
              <div className="h-32 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 relative border-b border-slate-800">
                <div className="absolute -bottom-14 left-6 rounded-full border-4 border-slate-900 bg-slate-950 shadow-xl">
                  <Avatar 
                    src={selectedPlayer.imageUrl || selectedPlayer.publicId} 
                    alt={selectedPlayer.user.name} 
                    fallback={selectedPlayer.user.name.charAt(0)}
                    className="w-28 h-28 text-3xl"
                  />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {selectedPlayer.category ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold">
                      {selectedPlayer.category.name} Tier (${selectedPlayer.category.basePrice})
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-amber-500/20 text-amber-300 border-amber-500/40 px-3 py-1 font-bold">
                      Needs Category Assignment
                    </Badge>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="pt-16 pb-6 px-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedPlayer.user.name}</h2>
                  <p className="text-slate-400 text-sm flex items-center gap-2 mt-0.5">
                    <span>{selectedPlayer.user.email}</span>
                    <span>•</span>
                    <span>Student ID: {selectedPlayer.studentId}</span>
                  </p>
                </div>

                {/* Scouting Admin Controls Form */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                    <Sliders className="w-4 h-4" />
                    <span>Admin Scouting & Category Assignment Controls</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Category Selection Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Assigned Category Tier
                      </label>
                      <select 
                        value={editCategoryId} 
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="" className="bg-slate-900 text-amber-400">-- Unassigned (Pending Trial) --</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                            {cat.name} Tier (Base Price: ${cat.basePrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Primary Position Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Primary Position
                      </label>
                      <select 
                        value={editPrimaryPos} 
                        onChange={(e) => setEditPrimaryPos(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {positions.map((p: any) => (
                          <option key={p.id} value={p.code} className="bg-slate-900 text-white">
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {!editCategoryId && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-amber-300 text-xs font-medium flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>This player cannot be pulled onto the Auction Podium until a Category is assigned.</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button 
                      onClick={() => updatePlayerMutation.mutate()}
                      disabled={updatePlayerMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 h-10 rounded-xl text-xs flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Scouting & Category Assignment</span>
                    </Button>
                  </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">Jersey Name</span>
                    <span className="text-white font-bold text-sm">{selectedPlayer.jerseyName || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">Academic Session</span>
                    <span className="text-white font-bold text-sm">{selectedPlayer.session || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">Secondary Positions</span>
                    <span className="text-white font-bold text-sm">
                      {selectedPlayer.secondaryPos?.length ? selectedPlayer.secondaryPos.join(', ') : 'None'}
                    </span>
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
