import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Crown, CheckCircle2, XCircle, Phone, Calendar } from 'lucide-react';
import api from '../../services/api';

export const AdminPodiumRequestsPage = () => {
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin', 'podium-requests'],
    queryFn: async () => {
      const res = await api.get('/users/podium-admin-requests');
      return res.data.data;
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' }) => {
      const res = await api.put(`/users/podium-admin-requests/${id}/verify`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin', 'podium-requests'] });
      queryClient.invalidateQueries({ queryKey: ['players', 'all'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification failed.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>Podium Admin Applications</span>
            <Crown className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-slate-400 text-sm">Review & verify applicant requests to grant live auction hosting rights.</p>
        </div>
      </div>

      {!applications || applications.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-purple-400 mb-1" />
            <h2 className="text-xl font-bold text-white">No Pending Applications</h2>
            <p className="text-slate-400 text-sm">There are no pending Podium Admin applications at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app: any) => (
            <Card key={app.id} className="bg-slate-900/90 border-2 border-purple-500/40 shadow-2xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-600/40 flex items-center justify-center shrink-0">
                      <Crown className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">{app.user?.name}</h2>
                      <p className="text-xs text-slate-400">{app.user?.email}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-400/40 font-bold text-xs">
                    PENDING APPROVAL
                  </Badge>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Phone: {app.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Shift Availability: {app.availability}</span>
                  </div>
                  {app.experience && (
                    <p className="text-slate-300 italic pt-2 border-t border-slate-800/80">
                      "{app.experience}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button 
                    variant="destructive"
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: app.id, action: 'REJECT' })}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Decline
                  </Button>
                  <Button 
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: app.id, action: 'APPROVE' })}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 rounded-xl shadow-lg shadow-purple-950/50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Podium Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
