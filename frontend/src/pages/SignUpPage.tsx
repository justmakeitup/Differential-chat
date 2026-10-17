import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SEOHead } from '../components/SEOHead';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface SignUpPageProps {
  onNavigate: (path: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Real-time password criteria
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasDigit && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!email.trim() || !username.trim() || !fullName.trim()) {
      setInlineError('All fields are required.');
      return;
    }

    if (!isPasswordValid) {
      setInlineError('Please meet all password strength requirements below.');
      return;
    }

    if (!agreedToTerms) {
      setInlineError('You must agree to the Zero-Knowledge Privacy Charter & Terms.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        password
      });

      addToast({
        type: 'gold',
        title: 'Membership Created',
        message: 'Welcome to Differential. Please complete your sovereign onboarding.'
      });
      onNavigate('/onboarding');
    } catch (err: any) {
      setInlineError(err.message || 'Registration failed. Username or email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-16 px-3 sm:px-4 flex items-center justify-center relative">
      <SEOHead
        title="Request Membership"
        description="Join Differential, the privacy-first sovereign connection network for curated minds and image artists."
      />

      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-obsidian-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 sm:p-8 relative">
        <div className="text-center space-y-2 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/30 border border-gold-500/40 dark:from-obsidian-800 dark:to-obsidian-900 dark:border-gold-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <span className="font-serif font-bold text-gold-600 dark:text-gold-400 text-xl">D</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white tracking-wide">
            Request Sanctuary Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-editorial-subtle">
            Begin your journey without surveillance or algorithmic tracking
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
              Full Legal or Moniker Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setInlineError(null);
                }}
                placeholder="e.g. Siobhan Thorne"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Unique Handle / Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                  setInlineError(null);
                }}
                placeholder="e.g. siobhan_t"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <span className="font-mono text-xs text-slate-500 absolute left-3.5 top-2.5">@</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInlineError(null);
                }}
                placeholder="siobhan@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
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

            {/* Password Requirements Checklist */}
            <div className="mt-3 p-3 rounded-xl bg-obsidian-950/70 border border-white/5 space-y-1.5 text-[11px]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-editorial-subtle block mb-1">
                Password Requirements
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLen ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasDigit ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Numeric digit</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-400' : 'text-slate-500'} col-span-2`}>
                  {hasSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Special symbol (!@#$%...)</span>
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-2 text-xs text-editorial-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 text-gold-500 focus:ring-gold-500 bg-obsidian-950"
            />
            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={() => onNavigate('/privacy')}
                className="text-gold-400 hover:text-gold-300 underline"
              >
                Zero-Knowledge Privacy Charter
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => onNavigate('/terms')}
                className="text-gold-400 hover:text-gold-300 underline"
              >
                Ethical Terms
              </button>
              .
            </span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !agreedToTerms}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Generating Cryptographic Identity...</span>
              ) : (
                <>
                  <span>Create Sovereign Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-editorial-subtle">
            Already have an identity?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="text-gold-400 hover:text-gold-300 font-medium cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
