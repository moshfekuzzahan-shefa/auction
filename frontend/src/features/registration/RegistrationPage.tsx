import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  User, Mail, Lock, Hash, Shirt, Calendar, Trophy, Shield, 
  ArrowRight, LogIn, UserPlus 
} from 'lucide-react';
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
      toast.success('Registration successful! Please sign in.');
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

  const sessions = configData?.data?.sessions?.length ? configData.data.sessions : [
    { id: 's1', name: '2020-2021' },
    { id: 's2', name: '2021-2022' },
    { id: 's3', name: '2022-2023' },
    { id: 's4', name: '2023-2024' },
    { id: 's5', name: '2024-2025' },
    { id: 's6', name: '2025-2026' },
  ];

  const positions = configData?.data?.positions?.length ? configData.data.positions : [
    { id: 'p1', code: 'GK', name: 'Goalkeeper' },
    { id: 'p2', code: 'CB', name: 'Center Back' },
    { id: 'p3', code: 'LB', name: 'Left Back' },
    { id: 'p4', code: 'RB', name: 'Right Back' },
    { id: 'p5', code: 'CM', name: 'Central Midfielder' },
    { id: 'p6', code: 'CAM', name: 'Attacking Midfielder' },
    { id: 'p7', code: 'LW', name: 'Left Wing' },
    { id: 'p8', code: 'RW', name: 'Right Wing' },
    { id: 'p9', code: 'ST', name: 'Striker' },
  ];

  const categories = configData?.data?.categories?.length ? configData.data.categories : [
    { id: 'c1', name: 'Platinum', basePrice: 1000 },
    { id: 'c2', name: 'Gold', basePrice: 750 },
    { id: 'c3', name: 'Silver', basePrice: 500 },
    { id: 'c4', name: 'Bronze', basePrice: 250 },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 my-auto">
      
      {/* Top Switcher Navigation */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 max-w-xs">
        <Link 
          to="/login"
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 text-slate-400 hover:text-white flex items-center justify-center space-x-2 text-center"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Link>
        <button 
          type="button"
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 bg-emerald-600 text-white shadow-md flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white">Player Registration</h2>
        <p className="text-sm text-slate-400">
          Complete your player profile to enter the upcoming franchise auction pool.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="e.g. Cristiano Ronaldo" 
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input 
                name="email" 
                type="email" 
                required 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="e.g. player@university.edu" 
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input 
                name="password" 
                type="password" 
                required 
                value={formData.password} 
                onChange={handleInputChange} 
                placeholder="Create secure password" 
                minLength={6} 
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Student ID
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input 
                name="studentId" 
                required 
                value={formData.studentId} 
                onChange={handleInputChange} 
                placeholder="e.g. 2021-1-60-000" 
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Jersey Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Jersey Name
            </label>
            <div className="relative">
              <Shirt className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input 
                name="jerseyName" 
                required 
                value={formData.jerseyName} 
                onChange={handleInputChange} 
                placeholder="Name on shirt back" 
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Academic Session */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Academic Session
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select 
                name="session" 
                required 
                value={formData.session} 
                onChange={handleInputChange} 
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-800 bg-slate-950/70 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select Academic Session</option>
                {sessions.map((s: any) => (
                  <option key={s.id} value={s.name} className="bg-slate-900 text-white">{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Primary Position
            </label>
            <div className="relative">
              <Trophy className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select 
                name="primaryPos" 
                required 
                value={formData.primaryPos} 
                onChange={handleInputChange} 
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-800 bg-slate-950/70 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select Primary Position</option>
                {positions.map((p: any) => (
                  <option key={p.id} value={p.code} className="bg-slate-900 text-white">{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>



        </div>

        {/* Secondary Positions */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Secondary Positions (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {positions.filter((p: any) => p.code !== formData.primaryPos).map((p: any) => {
              const isChecked = formData.secondaryPos.includes(p.code);
              return (
                <label 
                  key={p.id} 
                  className={`flex items-center space-x-2 text-xs border px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isChecked 
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    value={p.code} 
                    checked={isChecked}
                    onChange={(e) => {
                      const code = e.target.value;
                      setFormData(prev => {
                        const newSec = e.target.checked 
                          ? [...prev.secondaryPos, code]
                          : prev.secondaryPos.filter(pos => pos !== code);
                        return { ...prev, secondaryPos: newSec };
                      });
                    }}
                    className="hidden"
                  />
                  <span>{p.name} ({p.code})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Profile Image Upload */}
        <div className="pt-2">
          <FileUpload
            label="Profile Picture (Square Image Preferred)"
            accept="image/*"
            onChange={(file) => setImage(file)}
          />
        </div>

        <Button 
          type="submit" 
          disabled={registerMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
        >
          {registerMutation.isPending ? (
            <span>Registering Profile...</span>
          ) : (
            <>
              <span>Complete Player Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Bottom CTA Link */}
      <div className="pt-4 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">Already registered or managing a franchise?</p>
        <Link 
          to="/login" 
          className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
        >
          <span>Sign In to Account</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

    </div>
  );
};
