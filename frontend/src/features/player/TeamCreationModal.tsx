import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, Sparkles, Upload } from 'lucide-react';
import api from '../../services/api';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamCreationModal = ({ isOpen, onClose }: TeamCreationModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [brandColor, setBrandColor] = useState('#10B981');
  const [contactBio, setContactBio] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/teams/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Team creation request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['player', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'landing'] });
      onClose();
      // Reset form
      setName('');
      setCode('');
      setContactBio('');
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit team creation request.');
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide a Team Name.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('code', code.trim().toUpperCase());
    formData.append('brandColor', brandColor);
    formData.append('contactBio', contactBio.trim());
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    requestMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span>Request Franchise Team Registration</span>
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            Submit your franchise team details for Super Admin verification to enter as a Franchise Owner.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Team Name <span className="text-red-400">*</span>
            </label>
            <Input 
              placeholder="e.g., Royal Bengal FC" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-white rounded-xl focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
                Short Tag Code (e.g., RBF)
              </label>
              <Input 
                placeholder="RBF" 
                maxLength={4}
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white uppercase rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={brandColor} 
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <Input 
                  value={brandColor} 
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white rounded-xl font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Franchise Logo Image
            </label>
            <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <label className="flex-1 cursor-pointer">
                <span className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-4 h-4 text-emerald-400" /> Choose Logo Image
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 block">
              Owner Contact Info & Bio
            </label>
            <textarea 
              rows={3} 
              placeholder="Provide phone number, social contact or short manager bio..." 
              value={contactBio} 
              onChange={(e) => setContactBio(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={requestMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl shadow-lg shadow-emerald-950/50"
            >
              {requestMutation.isPending ? 'Submitting Request...' : 'Submit Franchise Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
