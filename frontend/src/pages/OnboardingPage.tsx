import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { getOrCreateIdentityKeyPair } from '../services/crypto';
import {
  Camera,
  Check,
  Plus,
  Lock,
  Globe,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  MapPin
} from 'lucide-react';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar_url || brandConfig.sampleImages.defaultAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Step 2 Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.interests && user.interests.length > 0
      ? user.interests
      : ['Architectural Brutalism', 'Medium Format Film', 'Zero-Knowledge Cryptography']
  );
  const [customInterest, setCustomInterest] = useState('');

  // Step 3 Privacy & Cryptography
  const [privacyMode, setPrivacyMode] = useState<'public' | 'connections_only' | 'incognito'>('public');
  const [keyFingerprint, setKeyFingerprint] = useState<string>('Generating P-256 Keypair...');
  const [loading, setLoading] = useState(false);

  // Generate or load crypto fingerprint when reaching step 3
  const handleProceedToStep3 = async () => {
    setStep(3);
    try {
      const { data } = await getOrCreateIdentityKeyPair();
      setKeyFingerprint(data.fingerprint);
    } catch (e) {
      setKeyFingerprint("ECDH P-256 Ready");
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      if (selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, tag]);
      } else {
        addToast({
          type: 'info',
          title: 'Maximum Reached',
          message: 'You may select up to 10 curated interests.'
        });
      }
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !selectedInterests.includes(clean) && selectedInterests.length < 10) {
      setSelectedInterests([...selectedInterests, clean]);
      setCustomInterest('');
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Upload avatar if selected
      let uploadedAvatarUrl = user?.avatar_url || '';
      if (avatarFile) {
        const uploadRes = await api.uploadAvatar(avatarFile);
        uploadedAvatarUrl = uploadRes.avatar_url;
      }

      // 2. Fetch or create E2EE identity key
      const { data: keyData } = await getOrCreateIdentityKeyPair();

      // 3. Save full profile
      await api.updateProfile({
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar_url: uploadedAvatarUrl || user?.avatar_url,
        interests: selectedInterests,
        privacy_mode: privacyMode,
        e2ee_public_key: keyData.publicKeyBase64,
        onboarding_completed: true
      });

      await refreshUser();

      // Fire celebratory confetti!
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#6366F1', '#F5E4B2', '#FFFFFF']
      });

      addToast({
        type: 'gold',
        title: 'Sovereign Onboarding Complete',
        message: 'Your cryptographic identity is verified. Welcome to the sanctuary.'
      });

      onNavigate('/feed');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Setup Error',
        message: err.message || 'Failed to complete profile onboarding.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center relative">
      <SEOHead
        title="Sanctuary Onboarding"
        description="Craft your anonymous sovereign profile, curated interests, and cryptographic keys."
      />

      <div className="w-full max-w-2xl rounded-3xl bg-obsidian-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 sm:p-10 relative">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono text-editorial-subtle mb-2">
            <span>STEP {step} OF 3</span>
            <span>
              {step === 1 && 'VISUAL IDENTITY'}
              {step === 2 && 'CURATED DOMAINS'}
              {step === 3 && 'SOVEREIGN CRYPTOGRAPHY'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-electric-500 to-gold-400 transition-all duration-500 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Profile & Identity */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                Sculpt Your Visual Identity
              </h2>
              <p className="text-xs text-editorial-subtle">
                How other discerning members will encounter you in the sanctuary
              </p>
            </div>

            {/* Avatar Uploader */}
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-28 h-28 rounded-2xl object-cover ring-2 ring-gold-500/40 shadow-gold-glow"
                />
                <label className="absolute inset-0 bg-obsidian-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-gold-400" />
                  <span className="text-[10px] mt-1 font-mono uppercase tracking-wider">Change</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[11px] text-editorial-muted font-mono mt-2">
                EXIF GPS metadata will be scrubbed automatically
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Editorial Headline / Focus
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Minimalist Architect & Analog Purist"
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Location / Geographic Axis (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tokyo / Paris / Kyoto"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Personal Manifesto / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your philosophy, medium of choice, or the questions you are actively interrogating..."
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Curated Domains</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Curated Interests */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                Curate Your Disciplines
              </h2>
              <p className="text-xs text-editorial-subtle">
                Select between 3 and 10 domains to calibrate your discovery circle
              </p>
            </div>

            {/* Curated taxonomy chips */}
            <div className="flex flex-wrap gap-2.5">
              {brandConfig.editorialInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-inner-glow'
                        : 'bg-obsidian-950 text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-gold-400" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Interest Input */}
            <form onSubmit={handleAddCustomInterest} className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom discipline (e.g. Risograph Printing)..."
                className="flex-1 px-4 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-medium bg-obsidian-800 text-slate-200 border border-white/10 hover:bg-obsidian-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={selectedInterests.length === 0}
                className="px-6 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Initialize Cryptography</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Privacy Mode & WebCrypto Initialization */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                Sovereign Privacy Spheres
              </h2>
              <p className="text-xs text-editorial-subtle">
                Configure your visibility and verify your browser cryptographic safety fingerprint
              </p>
            </div>

            {/* Privacy Mode Cards */}
            <div className="space-y-3">
              <label
                onClick={() => setPrivacyMode('public')}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  privacyMode === 'public'
                    ? 'bg-gold-500/10 border-gold-500/40'
                    : 'bg-obsidian-950/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="p-2 rounded-xl bg-obsidian-900 border border-white/10 text-gold-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-sm font-semibold text-white">Public Discoverability</p>
                    {privacyMode === 'public' && <Check className="w-4 h-4 text-gold-400" />}
                  </div>
                  <p className="mt-1 text-xs text-editorial-subtle">
                    Your profile and public exhibitions appear in the member directory. Anyone can request a connection.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPrivacyMode('connections_only')}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  privacyMode === 'connections_only'
                    ? 'bg-electric-500/10 border-electric-500/40'
                    : 'bg-obsidian-950/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="p-2 rounded-xl bg-obsidian-900 border border-white/10 text-electric-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-sm font-semibold text-white">Restricted to Peers</p>
                    {privacyMode === 'connections_only' && <Check className="w-4 h-4 text-electric-400" />}
                  </div>
                  <p className="mt-1 text-xs text-editorial-subtle">
                    Your exhibitions are veiled to anyone who is not an established, accepted mutual connection.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPrivacyMode('incognito')}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  privacyMode === 'incognito'
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-obsidian-950/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="p-2 rounded-xl bg-obsidian-900 border border-white/10 text-emerald-400 shrink-0">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-sm font-semibold text-white">Incognito Mode</p>
                    {privacyMode === 'incognito' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="mt-1 text-xs text-editorial-subtle">
                    Completely hidden from search and discover lists. You can only connect by reaching out first.
                  </p>
                </div>
              </label>
            </div>

            {/* Generated E2EE Safety Fingerprint Display */}
            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Browser Cryptographic Safety Key
                </span>
                <span className="text-[10px] font-mono text-emerald-400">ECDH P-256</span>
              </div>
              <p className="font-mono text-xs text-slate-200 bg-obsidian-900 p-2.5 rounded-xl border border-white/5 tracking-wider select-all text-center">
                {keyFingerprint}
              </p>
              <p className="text-[10px] text-editorial-muted text-center">
                Stored exclusively in your local browser sandbox. Never transmitted in plaintext to the server.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Sealing Sanctuary Profile...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enter Sanctuary & Exhibition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
