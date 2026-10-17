import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SEOHead } from '../components/SEOHead';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!identifier.trim()) {
      setInlineError('Please provide your email address or username.');
      return;
    }
    if (!password) {
      setInlineError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login({ identifier: identifier.trim(), password });
      addToast({
        type: 'gold',
        title: 'Welcome Back',
        message: 'Cryptographic session authenticated. Encrypted keys ready.'
      });
      onNavigate('/feed');
    } catch (err: any) {
      setInlineError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAccount = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setInlineError(null);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-16 px-3 sm:px-4 flex items-center justify-center relative">
      <SEOHead
        title="Sanctuary Authentication"
        description="Sign in to your private Differential sanctuary. Zero-knowledge authentication and encrypted sessions."
      />

      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-obsidian-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 sm:p-8 relative">
        {/* Monogram */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/30 border border-gold-500/40 dark:from-obsidian-800 dark:to-obsidian-900 dark:border-gold-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <span className="font-serif font-bold text-gold-600 dark:text-gold-400 text-xl">D</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white tracking-wide">
            Sign In to Sanctuary
          </h2>
          <p className="text-xs text-slate-500 dark:text-editorial-subtle">
            Zero-knowledge cryptographic session management
          </p>
        </div>

        {/* 1-Click Peer Demo Buttons */}
        <div className="mb-6 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold-600 dark:text-gold-400 block text-center font-medium">
            Instant 1-Click Peer Testing
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillAccount('host@differential.network', 'Cipher@2026')}
              className="p-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-700 dark:text-gold-300 text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-slate-900 dark:text-white">👤 Host (You)</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">host@differential.network</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillAccount('friend@differential.network', 'Cipher@2026')}
              className="p-2.5 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 border border-electric-500/30 text-electric-700 dark:text-electric-300 text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-slate-900 dark:text-white">👥 Friend (Guest)</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">friend@differential.network</span>
            </button>
          </div>
          <p className="text-[10px] text-editorial-muted text-center font-mono">
            *Host & Friend are already mutual connections ready for P2P chat
          </p>
        </div>

        {inlineError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{inlineError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Email Address or Handle
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setInlineError(null);
                }}
                placeholder="elena@differential.network or elena_v"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-200">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[11px] text-gold-400 hover:text-gold-300 transition-colors cursor-pointer"
              >
                Forgot key?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setInlineError(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white absolute right-3.5 top-3 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Node...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-editorial-subtle">
            Not a member yet?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="text-gold-400 hover:text-gold-300 font-medium cursor-pointer"
            >
              Request Access
            </button>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-editorial-muted font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted HTTP-Only Session Cookies</span>
        </div>
      </div>
    </div>
  );
};
