import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { PlayerPitchPosition } from '../../../components/ui/PlayerPitchPosition';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export const PlayerDashboardRegistrationView = () => {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['player', 'me'],
    queryFn: async () => {
      const res = await api.get('/player/me');
      return res.data.data;
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/player/withdraw');
    },
    onSuccess: () => {
      toast.success('Registration withdrawn successfully.');
      // The backend might also change the user role or delete the session.
      // But we can force a reload to refresh auth state
      window.location.reload();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to withdraw registration.');
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No active registration profile found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 relative">
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-background/80 shadow-sm font-bold">Registered</Badge>
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
            onClick={() => {
              if (window.confirm('Are you sure you want to withdraw your registration? This action cannot be undone.')) {
                withdrawMutation.mutate();
              }
            }}
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
                Your registration is confirmed. Keep an eye on the countdown timer above. Once the Auction phase begins, team managers will be able to bid on your profile based on your assigned category and base price.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
