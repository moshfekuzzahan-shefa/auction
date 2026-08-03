import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/ui/FileUpload';
import api from '../../services/api';

export const TeamManagerForm = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    teamName: '',
    managerName: '',
    managerEmail: '',
    managerPassword: ''
  });
  const [image, setImage] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const res = await api.post('/teams/create', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Team Franchise created successfully!');
      setFormData({ teamName: '', managerName: '', managerEmail: '', managerPassword: '' });
      setImage(null);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error('Team logo is required');
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value as string);
    });
    form.append('logo', image);
    
    createMutation.mutate(form);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Team Franchise</CardTitle>
        <p className="text-sm text-muted-foreground">Provision a new team and its manager account.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Franchise Name</label>
              <Input name="teamName" required value={formData.teamName} onChange={handleInputChange} placeholder="e.g. Manchester United" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Manager Full Name</label>
              <Input name="managerName" required value={formData.managerName} onChange={handleInputChange} placeholder="e.g. Sir Alex Ferguson" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Manager Email</label>
              <Input name="managerEmail" type="email" required value={formData.managerEmail} onChange={handleInputChange} placeholder="e.g. alex@university.edu" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Manager Password</label>
              <Input name="managerPassword" type="password" required value={formData.managerPassword} onChange={handleInputChange} placeholder="Secure password" minLength={6} />
            </div>
          </div>

          <div className="pt-2">
            <FileUpload
              label="Team Logo (Square Image Preferred)"
              accept="image/*"
              onChange={(file) => setImage(file)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating Franchise...' : 'Create Franchise & Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
