import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PlayerPitchPosition } from '../../components/ui/PlayerPitchPosition';
import { Trash2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const PlayerDashboard = () => {
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
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-primary mb-2" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Registration Incomplete</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't submitted your player profile yet. Complete your registration to join the auction pool and get drafted by a team!
              </p>
            </div>
            <Link to="/register/player">
              <Button size="lg" className="mt-4 px-8">
                Complete Your Registration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegistrationPhase = systemState?.currentPhase === 'REGISTRATION';

  // REGISTRATION PHASE VIEW
  if (isRegistrationPhase) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
        <Card className="overflow-hidden border-primary/20">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 relative">
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-background/80 shadow-sm font-bold">Registration Active</Badge>
            </div>
          </div>
          <CardContent className="pt-0 px-6 pb-8 relative">
            <div className="absolute -top-16 left-6 rounded-full border-4 border-background bg-background shadow-md">
              <Avatar 
                src={profile.imageUrl || profile.publicId} 
                alt={profile.user?.name} 
                fallback={profile.user?.name?.charAt(0)}
                className="w-32 h-32"
              />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-20 md:mt-0 md:ml-40 mb-8">
              <div>
                <h2 className="text-3xl font-bold">{profile.user?.name}</h2>
                <p className="text-muted-foreground font-medium">Jersey: {profile.jerseyName || 'N/A'}</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || profile.isSold}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Withdraw Registration
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pitch */}
              <div className="flex flex-col items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Position Selected</h3>
                <PlayerPitchPosition position={profile.primaryPos} className="shadow-lg" />
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge>{profile.primaryPos}</Badge>
                  {profile.secondaryPos?.map((pos: string) => (
                    <Badge key={pos} variant="outline">{pos}</Badge>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Student ID</p>
                    <p className="font-medium text-lg">{profile.studentId}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Academic Session</p>
                    <p className="font-medium text-lg">{profile.session || 'N/A'}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Assigned Category</p>
                    <p className="font-medium text-lg">{profile.category?.name || 'Pending'}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Base Price</p>
                    <p className="font-medium text-lg font-mono text-primary">${profile.category?.basePrice || 0}</p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">What's Next?</strong><br />
                    Your registration is confirmed. Keep an eye on the countdown timer. Once the Auction phase begins, team managers will be able to bid on your profile based on your assigned category and base price.
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
      <h1 className="text-3xl font-bold">Player Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <Avatar 
              src={profile.imageUrl || profile.publicId} 
              alt={profile.user?.name} 
              fallback={profile.user?.name?.charAt(0)}
              className="w-32 h-32 border-4 border-muted shadow-md"
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold">{profile.user?.name}</h2>
              <p className="text-muted-foreground">{profile.user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                <Badge variant="default">{profile.primaryPos}</Badge>
                {profile.secondaryPos?.map((pos: string) => (
                  <Badge key={pos} variant="secondary">{pos}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Student ID</p>
              <p className="font-medium">{profile.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academic Session</p>
              <p className="font-medium">{profile.session}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jersey Name</p>
              <p className="font-medium">{profile.jerseyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{profile.category?.name || 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auction Status</p>
              <p className="font-medium">{profile.isSold ? 'Sold' : 'Unsold'}</p>
            </div>
            {profile.team && (
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <p className="font-medium text-primary font-bold">{profile.team.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {systemState?.currentPhase === 'TOURNAMENT' && profile.team && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>My Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Goals</span>
                  <span className="font-bold text-xl">
                    {profile.playerEvents?.filter((e: any) => e.type === 'GOAL').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Assists</span>
                  <span className="font-bold text-xl">
                    {profile.assistEvents?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Yellow Cards</span>
                  <span className="font-bold text-xl text-yellow-600">
                    {profile.playerEvents?.filter((e: any) => e.type === 'YELLOW_CARD').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Red Cards</span>
                  <span className="font-bold text-xl text-red-600">
                    {profile.playerEvents?.filter((e: any) => e.type === 'RED_CARD').length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const allMatches = [...(profile.team.homeMatches || []), ...(profile.team.awayMatches || [])];
                  allMatches.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  
                  if (allMatches.length === 0) {
                    return <p className="text-muted-foreground">No fixtures scheduled.</p>;
                  }

                  return (
                    <div className="divide-y">
                      {allMatches.map((match: any) => (
                        <div key={match.id} className="py-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{match.homeTeam.name}</span>
                            <span className="text-sm font-bold bg-muted px-2 py-1 rounded">
                              {match.status === 'UPCOMING' ? 'vs' : `${match.homeScore} - ${match.awayScore}`}
                            </span>
                            <span className="font-medium">{match.awayTeam.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground text-center mt-2">
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
