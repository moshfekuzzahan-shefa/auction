import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/Card';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PlayerCard } from '../../components/ui/PlayerCard';
import { Search, LayoutGrid, List, ShieldAlert, CheckCircle2, Sliders, Sparkles, Crown } from 'lucide-react';
import { getCategoryTheme } from '../../utils/categoryTheme';
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

  const { data: dbCategories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/categories');
        return res.data.data;
      } catch {
        const res = await api.get('/public/landing');
        return res.data.data?.categories || [];
      }
    }
  });

  const categories = dbCategories && dbCategories.length > 0 
    ? dbCategories 
    : (publicConfig?.categories || []);

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

  // Quick Category Assignment Mutation for instant UI refresh
  const quickAssignCategoryMutation = useMutation({
    mutationFn: async ({ profileId, categoryId }: { profileId: string; categoryId: string }) => {
      const res = await api.put(`/player/admin/${profileId}`, {
        categoryId: categoryId || null
      });
      return res.data;
    },
    onMutate: async ({ profileId, categoryId }) => {
      await queryClient.cancelQueries({ queryKey: ['players', 'all'] });
      const previousPlayers = queryClient.getQueryData(['players', 'all']);

      queryClient.setQueryData(['players', 'all'], (old: any) => {
        if (!old) return old;
        const newCat = categories.find((c: any) => c.id === categoryId) || null;
        return old.map((p: any) => {
          if (p.id === profileId || p.userId === profileId) {
            return {
              ...p,
              categoryId: categoryId || null,
              category: newCat
            };
          }
          return p;
        });
      });

      return { previousPlayers };
    },
    onSuccess: (data) => {
      toast.success(`Category tier updated to ${data.data.category?.name || 'Unassigned'}!`);
      queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', 'all'], context.previousPlayers);
      }
      toast.error(err.response?.data?.message || 'Failed to update category tier');
    }
  });

  const togglePodiumAdminMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'User role updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    }
  });

  const handleTogglePodiumAdmin = (player: any) => {
    const isPodiumAdmin = player.user?.role === 'PODIUM_ADMIN';
    const newRole = isPodiumAdmin ? 'PLAYER' : 'PODIUM_ADMIN';
    const actionText = isPodiumAdmin ? 'Revoke Podium Admin rights from' : 'Grant Podium Admin rights to';

    if (confirm(`Are you sure you want to ${actionText} ${player.user?.name}?`)) {
      togglePodiumAdminMutation.mutate({
        userId: player.userId || player.user?.id,
        newRole
      });
    }
  };

  const updatePlayerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/player/admin/${selectedPlayer.id}`, {
        categoryId: editCategoryId || null,
        primaryPos: editPrimaryPos,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Player scouting details & category tier saved!');
      queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
      if (selectedPlayer) {
        setSelectedPlayer((prev: any) => prev ? { 
          ...prev, 
          categoryId: editCategoryId, 
          category: data.data.category || null,
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

  const selectedPlayerTheme = getCategoryTheme(selectedPlayer?.category?.name);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>Players Directory & Scouting</span>
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-sm">Super Admin Scouting Panel & Category Tier Assignment.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID, or position..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-white"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <Button 
              variant={viewMode === 'grid' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3 rounded-lg text-xs font-bold"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Grid
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'primary' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3 rounded-lg text-xs font-bold"
            >
              <List className="h-4 w-4 mr-2" /> Table
            </Button>
          </div>
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p>No players found matching "{searchQuery}"</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player: any) => (
            <PlayerCard
              key={player.id || player.userId}
              player={player}
              categories={categories}
              onSelectPlayer={setSelectedPlayer}
              onCategoryChange={(profileId, categoryId) => {
                quickAssignCategoryMutation.mutate({ profileId, categoryId });
              }}
              onTogglePodiumAdmin={handleTogglePodiumAdmin}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Category Tier Selector</th>
                  <th className="px-4 py-3">Base Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPlayers.map((player: any) => {
                  const theme = getCategoryTheme(player.category?.name);
                  return (
                    <tr 
                      key={player.id || player.userId} 
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                        <div className="flex items-center gap-3">
                          <Avatar 
                            src={player.imageUrl || player.publicId} 
                            alt={player.user.name} 
                            fallback={player.user.name.charAt(0)}
                          />
                          <div>
                            <div className={`font-bold ${theme.accentText}`}>{player.user.name}</div>
                            <div className="text-xs text-slate-400">{player.jerseyName || 'No Jersey'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{player.user.email}</td>
                      <td className="px-4 py-3 text-slate-400">{player.studentId || '-'}</td>
                      <td className="px-4 py-3 font-medium text-emerald-400">{player.primaryPos}</td>
                      <td className="px-4 py-3">
                        <select 
                          value={player.categoryId || player.category?.id || ''}
                          onChange={(e) => {
                            quickAssignCategoryMutation.mutate({
                              profileId: player.id || player.userId,
                              categoryId: e.target.value
                            });
                          }}
                          className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
                        >
                          <option value="" className="bg-slate-900 text-slate-400">-- Unassigned Tier --</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
                              {cat.name} (${cat.basePrice})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 font-mono text-white font-bold">
                        ${player.category?.basePrice || 0}
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admin Scouting & Category Assignment Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-900 border-slate-800 text-white shadow-2xl">
          {selectedPlayer && (
            <div className="flex flex-col">
              
              {/* Header Banner */}
              <div className={`h-32 bg-gradient-to-r ${selectedPlayerTheme.bgGradient} relative border-b ${selectedPlayerTheme.border}`}>
                <div className={`absolute -bottom-14 left-6 rounded-full border-4 border-slate-900 bg-slate-950 shadow-xl ${selectedPlayerTheme.glow}`}>
                  <Avatar 
                    src={selectedPlayer.imageUrl || selectedPlayer.publicId} 
                    alt={selectedPlayer.user.name} 
                    fallback={selectedPlayer.user.name.charAt(0)}
                    className="w-28 h-28 text-3xl"
                  />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {selectedPlayer.category ? (
                    <Badge variant="outline" className={`${selectedPlayerTheme.badge} px-3 py-1 font-bold shadow-sm`}>
                      {selectedPlayer.category.name} Tier (${selectedPlayer.category.basePrice})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-800/90 text-slate-300 border-slate-700 px-3 py-1 font-bold">
                      Unassigned Tier
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
                    <span>Admin Scouting & Category Tier Assignment Controls</span>
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
                        <option value="" className="bg-slate-900 text-amber-400">-- Unassigned Tier (Pending Trial) --</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
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
                      <span>This player cannot be pulled onto the Auction Podium until a Category Tier is assigned.</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    {selectedPlayer.user?.role !== 'SUPER_ADMIN' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleTogglePodiumAdmin(selectedPlayer);
                          setSelectedPlayer(null);
                        }}
                        className={selectedPlayer.user?.role === 'PODIUM_ADMIN' ? 'bg-red-950/50 hover:bg-red-900 border-red-800 text-red-200 text-xs font-bold rounded-xl' : 'bg-purple-950/60 hover:bg-purple-900 border-purple-700 text-purple-200 text-xs font-bold rounded-xl'}
                      >
                        <Crown className="w-3.5 h-3.5 mr-1.5" />
                        {selectedPlayer.user?.role === 'PODIUM_ADMIN' ? 'Revoke Podium Admin' : 'Promote to Podium Admin'}
                      </Button>
                    ) : <div />}

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
