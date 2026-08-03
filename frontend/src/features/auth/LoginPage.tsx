import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
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
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl border border-border grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left Side Football Field Visual Hero */}
        <FootballPitchSideHero subtitle="Access Super Admin controls, Podium Auctioneer room, or Team Manager purse strategy." />

        {/* Right Side Login Form */}
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Sign In to Platform</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and password to access your role
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. admin@football.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full h-11 text-base font-semibold shadow-md"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm">
            <p className="text-muted-foreground mb-3">Don't have an account?</p>
            <Link to="/register/player">
              <Button variant="outline" className="w-full">
                Register as a Player ⚽
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
