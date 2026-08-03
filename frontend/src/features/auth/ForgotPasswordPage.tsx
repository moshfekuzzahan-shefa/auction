import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetData, setResetData] = useState<{ email: string; resetToken?: string } | null>(null);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const res = await api.post('/auth/forgot-password', { email: userEmail });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset code generated successfully!');
      setResetData({
        email,
        resetToken: data.data?.resetToken
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your registered email address.');
      return;
    }
    forgotPasswordMutation.mutate(email);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 my-auto max-w-md mx-auto">
      
      {/* Header Back Button */}
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
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Forgot Password?</h2>
        <p className="text-sm text-slate-400">
          Enter your registered email address below and we will issue a password reset verification code.
        </p>
      </div>

      {resetData ? (
        <div className="p-6 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Reset Code Generated!</span>
          </div>

          <p className="text-xs text-slate-300">
            A verification code has been issued for <span className="font-bold text-white">{resetData.email}</span>.
          </p>

          {resetData.resetToken && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Your Verification Code</span>
              <div className="font-mono font-black text-2xl text-emerald-400 tracking-widest">{resetData.resetToken}</div>
            </div>
          )}

          <Button 
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(resetData.email)}&code=${resetData.resetToken || ''}`)}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
          >
            <span>Proceed to Reset Password</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 h-11 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center space-x-2 text-base"
          >
            {forgotPasswordMutation.isPending ? (
              <span>Sending Code...</span>
            ) : (
              <>
                <span>Send Reset Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};
