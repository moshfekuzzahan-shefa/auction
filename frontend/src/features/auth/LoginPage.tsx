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
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95">
      {/* Top Role/Navigation Switcher */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
        <button 
          type="button"
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 bg-emerald-600 text-white shadow-md flex items-center justify-center space-x-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </button>
        <Link 
          to="/register/player" 
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 text-slate-400 hover:text-white flex items-center justify-center space-x-2 text-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Player</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to Platform</h2>
        <p className="text-sm text-slate-400">
          Access Super Admin controls, Podium Auctioneer room, or Team Manager purse.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
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
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
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

      {/* Bottom CTA Link */}
      <div className="pt-6 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400 mb-2">New player entering the auction pool?</p>
        <Link 
          to="/register/player" 
          className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Create Player Account</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
};
