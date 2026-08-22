import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Trophy, Target, Award, XCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

export const TournamentLeaderboard = () => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/tournament/leaderboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96 w-full rounded-2xl bg-slate-900" />)}
      </div>
    );
  }

  const renderList = (players: any[], countLabel: string, countKey: string, accentColor: string, icon: React.ReactNode) => {
    if (!players || players.length === 0) {
      return <div className="text-slate-500 italic text-center py-8">No data available yet.</div>;
    }

    return (
      <div className="space-y-3 mt-4">
        {players.map((p, idx) => (
          <div key={p.playerId} className={`flex items-center p-3 rounded-xl border border-slate-800/50 bg-slate-900/50 transition-all hover:bg-slate-800/80 hover:border-slate-700 relative overflow-hidden group`}>
            
            {/* Rank Indicator */}
            <div className={`w-10 text-center font-black text-xl ${idx === 0 ? accentColor : 'text-slate-600'} shrink-0`}>
              {idx + 1}
            </div>

            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full border-2 ${idx === 0 ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-slate-700'} overflow-hidden shrink-0 bg-slate-950 flex items-center justify-center`}>
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500 font-bold">{p.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="ml-4 flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm truncate group-hover:text-amber-100 transition-colors">{p.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {p.teamLogo ? (
                  <img src={p.teamLogo} alt={p.teamName} className="w-4 h-4 object-contain" />
                ) : null}
                <span className="text-xs text-slate-400 truncate">{p.teamName}</span>
              </div>
            </div>

            {/* Stat */}
            <div className="flex flex-col items-end shrink-0 ml-2">
              <div className={`text-2xl font-black ${accentColor}`}>
                {p[countKey]}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {countLabel}
              </div>
            </div>

          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center py-6 mb-4">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 tracking-tight uppercase drop-shadow-sm">
          Tournament Leaders
        </h2>
        <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">
          Official Player Statistics & Awards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
        
        {/* Golden Boot (Goals) */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Target className="w-32 h-32 text-emerald-500" />
          </div>
          <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-950/40">
            <CardTitle className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest text-sm">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              Top Goalscorers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {renderList(leaderboard?.topScorers || [], 'Goals', 'goals', 'text-emerald-400', <Target />)}
          </CardContent>
        </Card>

        {/* Top Playmaker (Assists) */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Award className="w-32 h-32 text-sky-500" />
          </div>
          <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-950/40">
            <CardTitle className="flex items-center gap-3 text-sky-400 font-black uppercase tracking-widest text-sm">
              <div className="p-2 bg-sky-500/20 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              Top Assists
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {renderList(leaderboard?.topAssists || [], 'Assists', 'assists', 'text-sky-400', <Award />)}
          </CardContent>
        </Card>

        {/* MOTM King */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Trophy className="w-32 h-32 text-amber-500" />
          </div>
          <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-950/40">
            <CardTitle className="flex items-center gap-3 text-amber-400 font-black uppercase tracking-widest text-sm">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
              MOTM Awards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {renderList(leaderboard?.motmKings || [], 'Awards', 'motmAwards', 'text-amber-400', <Trophy />)}
          </CardContent>
        </Card>

        {/* Most Chances Missed */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <XCircle className="w-32 h-32 text-rose-500" />
          </div>
          <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-950/40">
            <CardTitle className="flex items-center gap-3 text-rose-400 font-black uppercase tracking-widest text-sm">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              Big Chances Missed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {renderList(leaderboard?.mostMisses || [], 'Misses', 'misses', 'text-rose-400', <XCircle />)}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
