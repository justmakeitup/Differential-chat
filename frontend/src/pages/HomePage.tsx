import React from 'react';
import { useAuth } from '../context/AuthContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Users,
  Image as ImageIcon
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      <SEOHead
        title="Sanctuary for Sovereign Connection"
        description="A peer-to-peer, zero-knowledge network crafted for discerning minds, curated imagery, and end-to-end encrypted dialogues. Meet your next meaningful connection."
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle background ambient gradients (visible in dark mode only) */}
        <div className="hidden dark:block absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-electric-600/15 blur-[140px] pointer-events-none rounded-full" />
        <div className="hidden dark:block absolute top-1/3 right-10 w-[400px] h-[300px] bg-gold-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="text-center max-w-3xl mx-auto relative z-10">
          {/* Editorial Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-gold-700 border border-gold-500/30 shadow-sm dark:bg-obsidian-900/80 dark:border-gold-500/30 dark:text-gold-300 text-xs font-mono tracking-wide mb-8 shadow-inner-glow">
            <Sparkles className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
            <span>Zero-Knowledge Peer-to-Peer Protocol</span>
          </div>

          {/* Primary CTA Headline - EXACT REQUIRED PHRASE ABOVE THE FOLD */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            Meet your next meaningful connection.
          </h1>

          <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-600 dark:text-editorial-subtle leading-relaxed max-w-2xl mx-auto">
            {brandConfig.subheading}
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => onNavigate('/feed')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Enter the Exhibition</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Request Membership</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/login')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm dark:bg-obsidian-900/80 dark:hover:bg-obsidian-800 dark:text-slate-300 dark:border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In to Sanctuary</span>
                </button>
              </>
            )}
          </div>

          {/* Sticky mobile CTA support notice */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Direct WebRTC P2P
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Strictly Image-Only
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              No Algorithmic Feeds
            </span>
          </div>
        </div>

        {/* Cinematic Visual Preview Card */}
        <div className="mt-16 md:mt-24 relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-200/60 to-transparent dark:from-white/15 dark:to-white/0 shadow-xl dark:shadow-2xl">
          <div className="rounded-[22px] overflow-hidden bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 relative shadow-sm">
            <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-obsidian-950/60">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex space-x-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-slate-600 dark:text-editorial-subtle truncate">differential://p2p-session/e2ee-channel-secure</span>
              </div>
              <div className="self-start sm:self-auto flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-gold-700 dark:text-gold-400 bg-gold-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-gold-500/20 whitespace-nowrap">
                <Lock className="w-3 h-3 shrink-0" />
                <span>WebRTC DataChannel • Zero-Knowledge</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
              {/* Sample Profile 1 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                    alt="Elena Rostova"
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-gold-500/40"
                  />
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-slate-900 dark:text-white">Elena Rostova</h4>
                    <p className="text-[11px] text-slate-500 dark:text-editorial-subtle">Architectural Minimalist</p>
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
                  alt="Monochrome concrete structure"
                  className="rounded-xl w-full h-44 object-cover"
                />
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">“Documenting the silence of concrete monolithic forms...”</p>
              </div>

              {/* Sample Profile 2 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                    alt="Julian Vance"
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-gold-500/40"
                  />
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-slate-900 dark:text-white">Julian Vance</h4>
                    <p className="text-[11px] text-slate-500 dark:text-editorial-subtle">Neuroscience & Dark Ambient</p>
                  </div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
                  alt="Modular synthesizers and patch cables"
                  className="rounded-xl w-full h-44 object-cover"
                />
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">“Exploring non-linear signal processing and acoustic synchronization.”</p>
              </div>

              {/* Sample Encrypted Dialogue Preview */}
              <div className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold-600 dark:text-gold-400 block">
                    Direct P2P E2EE Dialogue
                  </span>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200">
                    <p className="font-mono text-[10px] text-gold-600 dark:text-gold-400 mb-1">Elena Rostova</p>
                    The tactile resonance on that oscillator patch reminds me of the cathedral acoustics in Cologne.
                  </div>
                  <div className="p-3 rounded-xl bg-electric-50 dark:bg-electric-950/40 border border-electric-200 dark:border-electric-500/20 text-xs text-slate-800 dark:text-slate-200 ml-4">
                    <p className="font-mono text-[10px] text-electric-600 dark:text-electric-400 mb-1">Julian Vance</p>
                    Exactly. Space is just another acoustic filter. Zero surveillance makes dialogue real again.
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 text-center">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">AES-GCM-256 • ECDH-P256 Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Sovereign Pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
            Architecture for the Discerning
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-editorial-subtle">
            Every layer of Differential is intentionally designed to respect human dignity, creative sovereignty, and authentic dialogue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-gold-500/40 hover:shadow-md dark:bg-obsidian-900/60 dark:border-white/10 dark:hover:border-gold-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">Zero-Knowledge P2P</h3>
            <p className="text-xs text-slate-600 dark:text-editorial-subtle leading-relaxed">
              Messages never travel through a central database. We use WebRTC data channels with ECDH key derivation and AES-GCM 256-bit encryption. Even our engineers cannot decrypt your communications.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-electric-500/40 hover:shadow-md dark:bg-obsidian-900/60 dark:border-white/10 dark:hover:border-electric-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">Pure Photographic Curation</h3>
            <p className="text-xs text-slate-600 dark:text-editorial-subtle leading-relaxed">
              Strictly image-only. We explicitly reject short-form dopamine videos, algorithmic engagement hooks, and endless scrolling traps. Only contemplative visual art and deliberate discourse.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500/40 hover:shadow-md dark:bg-obsidian-900/60 dark:border-white/10 dark:hover:border-emerald-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-white">EXIF Scrubbing & Privacy Spheres</h3>
            <p className="text-xs text-slate-600 dark:text-editorial-subtle leading-relaxed">
              Every photograph uploaded has GPS location tags, camera serial numbers, and device fingerprints stripped at ingestion. Choose between Public, Connections Only, or Incognito visibility.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-gold-500/40 shadow-xl dark:bg-gradient-to-b dark:from-obsidian-900 dark:to-obsidian-950 dark:border-gold-500/30 dark:shadow-gold-glow relative overflow-hidden">
          <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[100px] pointer-events-none rounded-full" />
          <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-slate-900 dark:text-white">
            Reclaim your digital sovereignty.
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-editorial-subtle max-w-xl mx-auto">
            Step away from algorithmic extraction. Enter a calm, high-fidelity sanctuary where connections are intentional and private.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate(user ? '/discover' : '/signup')}
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold bg-gold-500 hover:bg-gold-400 text-slate-950 shadow-gold-glow transition-all cursor-pointer"
            >
              {user ? 'Discover Members' : 'Request Membership Access'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
