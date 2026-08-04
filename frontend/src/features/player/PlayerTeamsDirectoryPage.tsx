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
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/teams');
        return res.data.data || res.data;
      } catch (err) {
        return [];
      }
    }
  });

  const teams = (teamsData && Array.isArray(teamsData) && teamsData.length > 0)
    ? teamsData 
    : (landingData?.teams || []);

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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Team Details Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white shadow-2xl p-6">
          {selectedTeam && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0">
                  {selectedTeam.logoUrl ? (
                    <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-full h-full object-contain" />
                  ) : (
                    <Shield className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedTeam.name}</h2>
                  <p className="text-slate-400 text-xs font-semibold">Available Budget: ${selectedTeam.budget}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Drafted Roster ({selectedTeam.players?.length || 0})</span>
                </h3>

                {!selectedTeam.players || selectedTeam.players.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">No players drafted to this roster yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {selectedTeam.players.map((p: any) => {
                      const theme = getCategoryTheme(p.category?.name);
                      return (
                        <div key={p.id} className={`p-3 rounded-xl border bg-slate-950 flex items-center justify-between ${theme.border}`}>
                          <div>
                            <p className="font-bold text-sm text-white">{p.user?.name || p.name || 'Player'}</p>
                            <p className="text-xs text-slate-400">Position: {p.primaryPos || 'CM'}</p>
                          </div>
                          {p.category && (
                            <Badge variant="outline" className={`${theme.badge} text-[10px] font-bold px-2 py-0.5`}>
                              {p.category.name}
                            </Badge>
                          )}
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
