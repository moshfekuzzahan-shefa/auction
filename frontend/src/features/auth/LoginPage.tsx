import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import { setCredentials } from '../../store/authSlice';
import { FootballPitchSideHero } from '../../components/layout/FootballPitchSideHero';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/login', { email, password });
      return res.data.data;
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      toast.success('Login successful');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Hero Section (60% Width on Desktop) */}
        <div className="hidden lg:flex lg:col-span-7 h-full">
          <FootballPitchSideHero 
            title="Where Champions Are Drafted"
            subtitle="Access Super Admin controls, Podium Auctioneer room, or Team Manager purse strategy in one unified portal."
          />
        </div>

        {/* Right Form Section (40% Width on Desktop, 100% on Mobile) */}
        <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-between bg-slate-900/60 backdrop-blur-xl">
          
          {/* Top Switcher Navigation */}
          <div>
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-8">
              <button 
                type="button"
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 bg-emerald-600 text-white shadow-md flex items-center justify-center space-x-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <Link 
                to="/register/player" 
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 text-slate-400 hover:text-white flex items-center justify-center space-x-2 text-center"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Player</span>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your credentials to manage your team or platform.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="e.g. admin@football.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 mt-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loginMutation.isPending ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Bottom Switcher CTA */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 mb-2">New player entering the auction?</p>
            <Link 
              to="/register/player" 
              className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Create Player Account</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
