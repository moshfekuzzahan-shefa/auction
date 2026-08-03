import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import api from '../../services/api';

export const TeamDashboard = () => {
  const queryClient = useQueryClient();

  const { data: squadData, isLoading } = useQuery({
    queryKey: ['team', 'my-dashboard'],
    queryFn: async () => {
      const res = await api.get('/teams/my-dashboard');
      return res.data.data;
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/teams/notifications/read');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'my-dashboard'] });
    },
    onError: () => toast.error('Failed to mark notifications as read')
  });

  if (isLoading) return <div className="p-8">Loading Squad Data...</div>;

  const team = squadData?.team;
  const spent = squadData?.stats?.totalSpent || 0;
  const remaining = team ? team.budget - spent : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{team?.name} Dashboard</h1>
        {team?.logoUrl && <img src={team.logoUrl} alt="Team Logo" className="h-12 w-12 rounded-full object-cover" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${team?.budget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${spent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${remaining.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Squad ({squadData?.stats?.totalPlayers})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {team?.players?.length === 0 ? (
                <p className="text-muted-foreground">No players purchased yet.</p>
              ) : (
                <div className="divide-y">
                  {team?.players?.map((player: any) => (
                    <div key={player.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={player.imageUrl} alt={player.jerseyName} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium">{player.user.name}</p>
                          <p className="text-xs text-muted-foreground">{player.primaryPos}</p>
                        </div>
                      </div>
                      <div className="font-bold">${player.soldPrice?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auction Ledger (History)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {team?.ledgers?.length === 0 ? (
                <p className="text-muted-foreground">No auction activity.</p>
              ) : (
                <div className="divide-y">
                  {team?.ledgers?.map((ledger: any) => (
                    <div key={ledger.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Purchased Player</p>
                        <p className="text-xs text-muted-foreground">{new Date(ledger.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="font-bold">${ledger.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          {squadData?.notifications?.some((n: any) => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={() => markReadMutation.mutate()} disabled={markReadMutation.isPending}>
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {squadData?.notifications?.length === 0 ? (
              <p className="text-muted-foreground">No notifications.</p>
            ) : (
              <div className="divide-y">
                {squadData?.notifications?.map((notif: any) => (
                  <div key={notif.id} className={`py-3 ${notif.isRead ? 'opacity-60' : 'font-bold'}`}>
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
