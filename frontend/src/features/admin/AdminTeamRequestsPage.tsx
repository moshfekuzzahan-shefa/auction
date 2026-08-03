import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Shield, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import api from '../../services/api';

export const AdminTeamRequestsPage = () => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'team-requests'],
    queryFn: async () => {
      const res = await api.get('/teams/requests/pending');
      return res.data.data;
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' }) => {
      const res = await api.put(`/teams/requests/${id}/verify`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin', 'team-requests'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'landing'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification update failed.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>Pending Franchise Team Requests</span>
            <Clock className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-slate-400 text-sm">Review & approve unassigned player requests to register new franchise teams.</p>
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1" />
            <h2 className="text-xl font-bold text-white">All Caught Up!</h2>
            <p className="text-slate-400 text-sm">There are no pending team registration requests right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req: any) => (
            <Card key={req.id} className="bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0">
                      {req.logoUrl ? (
                        <img src={req.logoUrl} alt={req.name} className="w-full h-full object-contain" />
                      ) : (
                        <Shield className="w-8 h-8 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">{req.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-slate-950 text-slate-300 font-mono text-[10px] uppercase border border-slate-800">
                          TAG: {req.code || 'N/A'}
                        </Badge>
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20" 
                          style={{ backgroundColor: req.brandColor || '#10B981' }} 
                          title="Brand Color"
                        />
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-400/40 font-bold text-xs">
                    PENDING
                  </Badge>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">{req.requester?.name || 'Requester User'}</span>
                    <span className="text-slate-500">({req.requester?.email})</span>
                  </div>
                  {req.contactBio && (
                    <p className="text-slate-300 italic pt-1 border-t border-slate-800/80">
                      "{req.contactBio}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button 
                    variant="destructive"
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: req.id, action: 'REJECT' })}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold rounded-xl"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Decline Request
                  </Button>
                  <Button 
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: req.id, action: 'APPROVE' })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 rounded-xl shadow-lg shadow-emerald-950/50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Franchise
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
