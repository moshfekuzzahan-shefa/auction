import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Crown, Sparkles } from 'lucide-react';
import api from '../../services/api';

interface PodiumAdminApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PodiumAdminApplicationModal = ({ isOpen, onClose }: PodiumAdminApplicationModalProps) => {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('');

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/users/podium-admin-request', {
        phone,
        availability,
        experience
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Application submitted successfully to Super Admin!');
      queryClient.invalidateQueries({ queryKey: ['player', 'me'] });
      onClose();
      setPhone('');
      setAvailability('');
      setExperience('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !availability.trim()) {
      toast.error('Please provide phone contact and shift availability.');
      return;
    }
    applyMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-400" />
            <span>Apply for Podium Admin Rights</span>
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            Become an official Podium Admin to conduct live player auctions and manage live bid sessions.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Contact Phone Number <span className="text-red-400">*</span>
            </label>
            <Input 
              placeholder="+880 1700-000000" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Preferred Auction Shift / Availability <span className="text-red-400">*</span>
            </label>
            <Input 
              placeholder="e.g., Evening Shift / Round 1 & Round 2" 
              value={availability} 
              onChange={(e) => setAvailability(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Prior Experience & Why You Want to Host
            </label>
            <textarea 
              rows={3} 
              placeholder="Share short experience hosting events, esports tournaments, or auctions..." 
              value={experience} 
              onChange={(e) => setExperience(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={applyMutation.isPending}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-purple-950/50"
            >
              {applyMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
