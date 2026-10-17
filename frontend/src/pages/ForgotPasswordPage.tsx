import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SEOHead } from '../components/SEOHead';
import { Mail, KeyRound, Lock, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { addToast } = useToast();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setMessage(null);

    if (!email.trim()) {
      setInlineError('Email address is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setMessage(res.message);
      setStep('reset');
      addToast({
        type: 'info',
        title: 'Check Your Inbox',
        message: 'Use the reset token sent to your email to establish a new password.'
      });
    } catch (err: any) {
      setInlineError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!resetToken.trim() || !newPassword) {
      setInlineError('Both token and new password are required.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(resetToken.trim(), newPassword);
      addToast({
        type: 'gold',
        title: 'Password Restored',
        message: 'Your sanctuary password has been updated. You may now sign in.'
      });
      onNavigate('/login');
    } catch (err: any) {
      setInlineError(err.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center relative">
      <SEOHead
        title="Password Recovery"
        description="Reset your Differential sanctuary passphrase using zero-knowledge reset tokens."
      />

      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-obsidian-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-8 relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/30 border border-gold-500/40 dark:from-obsidian-800 dark:to-obsidian-900 dark:border-gold-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <KeyRound className="w-6 h-6 text-gold-600 dark:text-gold-400" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white tracking-wide">
            {step === 'request' ? 'Password Recovery' : 'Establish New Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-editorial-subtle">
            {step === 'request'
              ? 'Enter your registered email to receive a recovery token'
              : 'Enter the recovery token and your new strong password'}
          </p>
        </div>

        {inlineError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{inlineError}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}


        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@differential.network"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <span>Transmitting Token...</span> : <span>Generate Recovery Token</span>}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">
                Recovery Token
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">
                New Strong Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 symbol..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="px-4 py-3 rounded-xl text-xs text-slate-400 hover:text-white bg-obsidian-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <span>Applying Cipher...</span> : <span>Save New Password</span>}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <button
            onClick={() => onNavigate('/login')}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
