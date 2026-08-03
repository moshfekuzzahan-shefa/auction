import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PlayerPitchPosition } from '../../components/ui/PlayerPitchPosition';
import { Shield, Trophy, Users, User, ArrowRight, Sparkles } from 'lucide-react';
import { getCategoryTheme } from '../../utils/categoryTheme';
import api from '../../services/api';

export const PlayerMyTeamPage = () => {
  const { data: myProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['player', 'me'],
    queryFn: async () => {
      const res = await api.get('/player/me');
      return res.data.data;
    }
  });

  const { data: landingData } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  if (isProfileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const team = myProfile?.team;

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span>My Squad & Team</span>
          <Shield className="w-6 h-6 text-emerald-400" />
        </h1>

        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Unassigned Franchise Squad</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                You are currently an unassigned player in the tournament pool. During Phase 3 (Auction Phase), franchise teams will bid on your profile to recruit you to their official roster!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find full team details with players if available
  const fullTeam = landingData?.teams?.find((t: any) => t.id === team.id) || team;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-emerald-400/50 p-2 shadow-xl flex items-center justify-center shrink-0">
            {fullTeam.logoUrl ? (
              <img src={fullTeam.logoUrl} alt={fullTeam.name} className="w-full h-full object-contain" />
            ) : (
              <Shield className="w-10 h-10 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs">
                OFFICIAL FRANCHISE SQUAD
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-white mt-1">{fullTeam.name}</h1>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Squad Roster: {fullTeam.players?.length || fullTeam._count?.players || 0} Players
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center sm:text-right">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">Franchise Budget</span>
            <span className="text-2xl font-black font-mono text-emerald-400">${fullTeam.budget || 0}</span>
          </div>
        </div>
      </div>

      {/* Squad Members Directory */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span>Squad Teammates ({fullTeam.players?.length || 0})</span>
        </h2>

        {!fullTeam.players || fullTeam.players.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-400">
              No additional teammates drafted yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fullTeam.players.map((player: any) => {
              const theme = getCategoryTheme(player.category?.name);
              const isMe = player.id === myProfile.id || player.userId === myProfile.userId;

              return (
                <Card 
                  key={player.id || player.userId}
                  className={`overflow-hidden bg-gradient-to-br ${theme.bgGradient} ${theme.border} ${theme.glow} border-2 rounded-2xl transition-all duration-300 ${isMe ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="relative inline-block">
                      <Avatar 
                        src={player.imageUrl || player.publicId} 
                        alt={player.user?.name || player.name} 
                        fallback={(player.user?.name || player.name || 'P').charAt(0)}
                        className={`w-16 h-16 border-2 ${theme.border} shadow-lg mx-auto`}
                      />
                      {isMe && (
                        <Badge className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0">
                          YOU
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className={`font-black text-base truncate ${theme.accentText}`}>
                        {player.user?.name || player.name || 'Teammate'}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">
                        Pos: <span className="text-emerald-400">{player.primaryPos || 'CM'}</span>
                      </p>
                    </div>

                    <div className="flex justify-center">
                      {player.category ? (
                        <Badge variant="outline" className={`${theme.badge} text-[10px] font-bold px-2 py-0.5`}>
                          {player.category.name} (${player.category.basePrice})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 text-[10px]">
                          Squad Member
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
