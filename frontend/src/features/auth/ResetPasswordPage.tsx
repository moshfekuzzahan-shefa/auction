import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Mail, Key, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlCode = searchParams.get('code');
    if (urlEmail) setEmail(urlEmail);
    if (urlCode) setCode(urlCode);
  }, [searchParams]);

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/reset-password', {
        email,
        resetToken: code,
        newPassword
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully! Please log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code) {
      toast.error('Email and verification code are required.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    resetPasswordMutation.mutate();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 my-auto max-w-md mx-auto">
      
      <div className="flex items-center">
        <Link 
          to="/login"
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Set New Password</h2>
        <p className="text-sm text-slate-400">
          Enter your verification code and choose a strong new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Registered Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Verification Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            6-Digit Verification Code
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <Input
              type="text"
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white font-mono tracking-widest placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
        >
          {resetPasswordMutation.isPending ? (
            <span>Updating Password...</span>
          ) : (
            <>
              <span>Save New Password</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
