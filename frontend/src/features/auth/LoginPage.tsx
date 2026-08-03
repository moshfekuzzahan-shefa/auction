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
import { useAppSelector } from '../../store/hooks';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentPhase } = useAppSelector((state) => state.system);

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
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the platform
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
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
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm border-t pt-4 mt-2">
          <p className="text-muted-foreground mb-4">Don't have an account?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/player">
              <Button variant="outline" className="w-full sm:w-auto">Register as a Player</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
