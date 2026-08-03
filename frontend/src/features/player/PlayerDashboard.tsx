import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PlayerPitchPosition } from '../../components/ui/PlayerPitchPosition';
import { Trash2, AlertCircle, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { getCategoryTheme } from '../../utils/categoryTheme';
import { TeamCreationModal } from './TeamCreationModal';
import api from '../../services/api';

export const PlayerDashboard = () => {
  const queryClient = useQueryClient();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['player', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get('/player/me');
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    }
  });

  const { data: systemState } = useQuery({
    queryKey: ['system', 'state'],
    queryFn: async () => {
      const res = await api.get('/system');
      return res.data.data;
    }
  });

  const readUpdatesMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/player/read-updates');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', 'me'] });
      toast.success('Admin updates acknowledged!');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/player/withdraw');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Registration withdrawn successfully.');
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    }
  });

  const handleWithdraw = () => {
    if (confirm('Are you absolutely sure you want to withdraw your registration? This action cannot be undone.')) {
      withdrawMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // EMPTY STATE / NOT REGISTERED YET
  if (!profile || isError) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>
        <Card className="border-emerald-500/20 bg-slate-900/90">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-emerald-400 mb-2" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Registration Incomplete</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                You haven't submitted your player profile yet. Complete your registration to join the auction pool and get drafted by a team!
              </p>
            </div>
            <Link to="/register/player">
              <Button size="lg" className="mt-4 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50">
                Complete Your Registration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegistrationPhase = systemState?.currentPhase === 'REGISTRATION';
  const myCategoryTheme = getCategoryTheme(profile.category?.name);

  const AdminUpdateAlert = () => {
    if (!profile?.hasUnreadAdminUpdates) return null;
    return (
      <div className="p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
          <div>
            <span className="font-black text-amber-300 text-xs tracking-wider uppercase block">ADMIN UPDATE NOTIFICATION</span>
            <p className="text-white text-sm font-bold mt-0.5">
              {profile.lastAdminChange || 'Your category tier or scouting details were updated by an admin.'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => readUpdatesMutation.mutate()}
          disabled={readUpdatesMutation.isPending}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 h-9 rounded-xl text-xs shrink-0 shadow-md"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Mark as Acknowledged
        </Button>
      </div>
    );
  };

  const CreateTeamButton = () => {
    if (profile?.teamId || profile?.team) return null;
    return (
      <Button 
        onClick={() => setIsCreateTeamOpen(true)}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/40 text-xs flex items-center gap-2 border border-emerald-400/30 shrink-0"
      >
        <Shield className="w-4 h-4 text-emerald-300" />
        <span>Want to enter as Franchise Owner? Create Team Request</span>
      </Button>
    );
  };

  // REGISTRATION PHASE VIEW
  if (isRegistrationPhase) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>
            <CreateTeamButton />
          </div>
          <AdminUpdateAlert />
        </div>
        <TeamCreationModal isOpen={isCreateTeamOpen} onClose={() => setIsCreateTeamOpen(false)} />
        <Card className={`overflow-hidden border shadow-2xl bg-gradient-to-br ${myCategoryTheme.bgGradient} ${myCategoryTheme.border} ${myCategoryTheme.glow}`}>
          <div className="h-32 relative border-b border-white/10">
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className={`${myCategoryTheme.badge} shadow-sm font-bold px-3 py-1 text-xs`}>
                {profile.category?.name ? `${profile.category.name} Tier` : 'Pending Category'}
              </Badge>
            </div>
          </div>
          <CardContent className="pt-0 px-6 pb-8 relative">
            <div className={`absolute -top-16 left-6 rounded-full border-4 border-slate-950 bg-slate-950 shadow-xl ${myCategoryTheme.glow}`}>
              <Avatar 
                src={profile.imageUrl || profile.publicId} 
                alt={profile.user?.name} 
                fallback={profile.user?.name?.charAt(0)}
                className="w-32 h-32"
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-20 md:mt-0 md:ml-40 mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">{profile.user?.name}</h2>
                <p className="text-slate-400 font-medium text-sm">Jersey Name: {profile.jerseyName || 'N/A'}</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || profile.isSold}
                className="bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-bold rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Withdraw Registration
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pitch */}
              <div className="flex flex-col items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Position Selected</h3>
                <PlayerPitchPosition position={profile.primaryPos} className="shadow-lg" />
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge className="bg-emerald-600 text-white font-bold">{profile.primaryPos}</Badge>
                  {profile.secondaryPos?.map((pos: string) => (
                    <Badge key={pos} variant="outline" className="border-slate-700 text-slate-300">{pos}</Badge>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Student ID</p>
                    <p className="font-bold text-lg text-white">{profile.studentId}</p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Academic Session</p>
                    <p className="font-bold text-lg text-white">{profile.session || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Assigned Category</p>
                    <p className={`font-bold text-lg ${myCategoryTheme.accentText}`}>
                      {profile.category?.name || 'Pending Trial'}
                    </p>
                  </div>
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Base Price</p>
                    <p className={`font-black text-xl font-mono ${myCategoryTheme.accentText}`}>
                      ${profile.category?.basePrice || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl text-sm text-slate-300">
                  <p>
                    <strong className="text-white">What's Next?</strong><br />
                    Your player registration is locked and ready. Once the Auction phase begins, team managers will bid on your profile starting at your category base price.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STANDARD / TOURNAMENT PHASE VIEW
  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>
          <CreateTeamButton />
        </div>
        <AdminUpdateAlert />
      </div>
      <TeamCreationModal isOpen={isCreateTeamOpen} onClose={() => setIsCreateTeamOpen(false)} />

      <Card className={`overflow-hidden border shadow-2xl bg-gradient-to-br ${myCategoryTheme.bgGradient} ${myCategoryTheme.border} ${myCategoryTheme.glow}`}>
        <CardHeader className="bg-slate-950/70 border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
            <span>My Profile Details</span>
            <Badge variant="outline" className={`${myCategoryTheme.badge} font-bold px-3 py-1 text-xs`}>
              {profile.category?.name || 'Unassigned'} Tier
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <Avatar 
              src={profile.imageUrl || profile.publicId} 
              alt={profile.user?.name} 
              fallback={profile.user?.name?.charAt(0)}
              className={`w-32 h-32 border-4 border-slate-950 shadow-xl ${myCategoryTheme.glow}`}
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-white">{profile.user?.name}</h2>
              <p className="text-slate-400 text-sm">{profile.user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                <Badge className="bg-emerald-600 text-white font-bold">{profile.primaryPos}</Badge>
                {profile.secondaryPos?.map((pos: string) => (
                  <Badge key={pos} variant="secondary" className="bg-slate-950 text-slate-300 border border-slate-800">{pos}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold">Student ID</p>
              <p className="font-bold text-white">{profile.studentId}</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold">Academic Session</p>
              <p className="font-bold text-white">{profile.session}</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold">Jersey Name</p>
              <p className="font-bold text-white">{profile.jerseyName}</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold">Category Tier</p>
              <p className={`font-bold ${myCategoryTheme.accentText}`}>{profile.category?.name || 'Pending'}</p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold">Auction Status</p>
              <p className="font-bold text-white">{profile.isSold ? 'Sold' : 'Unsold'}</p>
            </div>
            {profile.team && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-semibold">Assigned Team</p>
                <p className="font-extrabold text-emerald-400">{profile.team.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {systemState?.currentPhase === 'TOURNAMENT' && profile.team && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white">My Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Goals</span>
                  <span className="font-extrabold text-xl text-white">
                    {profile.playerEvents?.filter((e: any) => e.type === 'GOAL').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Assists</span>
                  <span className="font-extrabold text-xl text-white">
                    {profile.assistEvents?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Yellow Cards</span>
                  <span className="font-extrabold text-xl text-yellow-400">
                    {profile.playerEvents?.filter((e: any) => e.type === 'YELLOW_CARD').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Red Cards</span>
                  <span className="font-extrabold text-xl text-red-500">
                    {profile.playerEvents?.filter((e: any) => e.type === 'RED_CARD').length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white">My Fixtures</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(() => {
                  const allMatches = [...(profile.team.homeMatches || []), ...(profile.team.awayMatches || [])];
                  allMatches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  
                  if (allMatches.length === 0) {
                    return <p className="text-slate-400 text-sm">No fixtures scheduled yet.</p>;
                  }

                  return (
                    <div className="divide-y divide-slate-800">
                      {allMatches.map((match: any) => (
                        <div key={match.id} className="py-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-white">{match.homeTeam.name}</span>
                            <span className="text-xs font-mono font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-emerald-400">
                              {match.status === 'UPCOMING' ? 'vs' : `${match.homeScore} - ${match.awayScore}`}
                            </span>
                            <span className="font-bold text-white">{match.awayTeam.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 text-center mt-2">
                            Status: {match.status} | Round: {match.round}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
