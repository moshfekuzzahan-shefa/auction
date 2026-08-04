import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { Shield, Users, Trophy } from 'lucide-react';
import { getCategoryTheme } from '../../utils/categoryTheme';
import api from '../../services/api';

export const PlayerTeamsDirectoryPage = () => {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const { data: landingData, isLoading: landingLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      try {
        const res = await api.get('/public/landing');
        const payload = res.data?.data || res.data;
        return payload?.teams || payload?.data?.teams || [];
      } catch {
        return [];
      }
    }
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/teams');
        const raw = res.data;
        const list = Array.isArray(raw) 
          ? raw 
          : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.teams) ? raw.teams : (raw?.data?.teams || [])));
        return list;
      } catch (err) {
        return [];
      }
    }
  });

  const teams = (teamsData && Array.isArray(teamsData) && teamsData.length > 0)
    ? teamsData 
    : (landingData && Array.isArray(landingData) ? landingData : (landingData?.teams || []));

  const isLoading = landingLoading && teamsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>Participating Franchises</span>
            <Trophy className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-sm">Official Franchise Teams & Roster Composition Directory.</p>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center text-slate-400">
            No franchise teams registered yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {teams.map((t: any) => {
            const squadCount = t.players?.length || t._count?.players || 0;

            const catCounts: Record<string, number> = {};
            if (t.players) {
              t.players.forEach((p: any) => {
                const name = p.category?.name || 'Unassigned';
                catCounts[name] = (catCounts[name] || 0) + 1;
              });
            }

            return (
              <Card 
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className="bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden group"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0 group-hover:border-emerald-500/40 transition-colors">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-8 h-8 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-white group-hover:text-emerald-400 transition-colors">{t.name}</h3>
                      <p className="text-xs font-semibold text-slate-400">Roster: {squadCount} Players</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-semibold">Remaining Budget</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">${t.budget || 0}</span>
                  </div>

                  {t.players && t.players.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(catCounts).map(([catName, count]) => {
                        const theme = getCategoryTheme(catName);
                        return (
                          <Badge key={catName} variant="outline" className={`${theme.badge} text-[10px] font-bold px-2 py-0.5`}>
                            {catName}: {count}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>View Roster & Player Profiles</span>
                    <span>→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Team Details Modal with Player Profile List */}
      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-800 text-white shadow-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0">
                    {selectedTeam.logoUrl ? (
                      <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-full h-full object-contain" />
                    ) : (
                      <Shield className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedTeam.name}</h2>
                    {selectedTeam.manager?.name && (
                      <p className="text-slate-400 text-xs font-semibold">
                        Manager: <span className="text-slate-200">{selectedTeam.manager.name}</span> {selectedTeam.manager.email && `(${selectedTeam.manager.email})`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Purse Remaining</span>
                  <span className="font-mono font-black text-emerald-400 text-lg">${(selectedTeam.budget || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Roster Players List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Team Player Roster ({selectedTeam.players?.length || 0})</span>
                  </h3>
                  <Badge className="bg-slate-950 text-slate-300 border border-slate-800 font-mono text-xs">
                    {selectedTeam.players?.length || 0} Drafted
                  </Badge>
                </div>

                {!selectedTeam.players || selectedTeam.players.length === 0 ? (
                  <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                    No players assigned or drafted to this team roster yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {selectedTeam.players.map((p: any) => {
                      const theme = getCategoryTheme(p.category?.name);
                      const playerName = p.user?.name || p.name || 'Player';
                      const avatarUrl = p.imageUrl || '/default-avatar.png';
                      const pos = p.primaryPos || 'CM';
                      const secondaries = Array.isArray(p.secondaryPos) ? p.secondaryPos.join(', ') : p.secondaryPos;
                      const price = p.soldPrice || p.basePrice || 0;

                      return (
                        <div 
                          key={p.id} 
                          className={`p-3.5 rounded-xl border bg-slate-950 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all ${theme.border}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700/80 bg-zinc-800 shrink-0 flex items-center justify-center">
                              <img 
                                src={avatarUrl} 
                                alt={playerName} 
                                className="w-full h-full object-cover scale-110" 
                                onError={(e) => { (e.target as HTMLElement).setAttribute('src', '/default-avatar.png'); }}
                              />
                            </div>

                            <div className="space-y-0.5">
                              <p className="font-bold text-sm text-white">{playerName}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <span className="font-bold text-emerald-400">{pos}</span>
                                {secondaries && <span className="text-[10px] text-slate-500">({secondaries})</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {p.category && (
                              <Badge variant="outline" className={`${theme.badge} text-[10px] font-bold px-2 py-0.5`}>
                                {p.category.name}
                              </Badge>
                            )}
                            {price > 0 && (
                              <span className="font-mono text-xs font-bold text-emerald-400">${price.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
