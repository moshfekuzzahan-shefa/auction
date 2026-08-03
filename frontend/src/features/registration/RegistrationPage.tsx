import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/ui/FileUpload';
import api from '../../services/api';

export const RegistrationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    session: '',
    jerseyName: '',
    primaryPos: '',
    secondaryPos: [] as string[],
    categoryId: '',
  });
  const [image, setImage] = useState<File | null>(null);

  const { data: configData } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const res = await api.post('/player/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.primaryPos) {
      toast.error('Primary position is required');
      return;
    }

    if (!image) {
      toast.error('Profile image is required');
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'secondaryPos') {
        form.append(key, (value as string[]).join(','));
      } else {
        form.append(key, value as string);
      }
    });
    form.append('image', image);
    
    registerMutation.mutate(form);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Only render if we have the configuration data from the REGISTRATION phase
  if (!configData?.data?.categories) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
             <CardTitle>Portal Closed</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Registration is not currently open.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl animate-in fade-in zoom-in-95">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold">Player Registration</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Complete your profile to enter the auction pool.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <Input name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Cristiano Ronaldo" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="e.g. ronaldo@university.edu" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input name="password" type="password" required value={formData.password} onChange={handleInputChange} placeholder="Create a secure password" minLength={6} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Student ID</label>
                <Input name="studentId" required value={formData.studentId} onChange={handleInputChange} placeholder="e.g. 2021-1-60-000" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Jersey Name</label>
                <Input name="jerseyName" required value={formData.jerseyName} onChange={handleInputChange} placeholder="Name on back of shirt" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Academic Session</label>
                <select name="session" required value={formData.session} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Select Session</option>
                  {configData.data.sessions?.map((s: any) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Primary Position</label>
                <select name="primaryPos" required value={formData.primaryPos} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Select Position</option>
                  {configData.data.positions?.map((p: any) => (
                    <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Secondary Positions (Optional)</label>
                <div className="flex flex-wrap gap-3">
                  {configData.data.positions?.filter((p: any) => p.code !== formData.primaryPos).map((p: any) => (
                    <label key={p.id} className="flex items-center space-x-2 text-sm border p-2 rounded-md cursor-pointer hover:bg-muted">
                      <input 
                        type="checkbox" 
                        value={p.code} 
                        checked={formData.secondaryPos.includes(p.code)}
                        onChange={(e) => {
                          const code = e.target.value;
                          setFormData(prev => {
                            const newSec = e.target.checked 
                              ? [...prev.secondaryPos, code]
                              : prev.secondaryPos.filter(pos => pos !== code);
                            return { ...prev, secondaryPos: newSec };
                          });
                        }}
                      />
                      <span>{p.name} ({p.code})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Player Tier (Base Price)</label>
                <select name="categoryId" required value={formData.categoryId} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Select Tier</option>
                  {configData.data.categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} (Base: {c.basePrice})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <FileUpload
                label="Profile Picture (Square Image Preferred)"
                accept="image/*"
                onChange={(file) => setImage(file)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-12" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registering...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
