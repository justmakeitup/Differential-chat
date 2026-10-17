import React from 'react';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { Sparkles, ShieldCheck, ArrowRight, Heart } from 'lucide-react';

interface ThankYouPageProps {
  onNavigate: (path: string) => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center relative">
      <SEOHead
        title="Sanctuary Acknowledgments"
        description="Thank you for participating in the sovereign Differential network."
      />

      <div className="max-w-xl w-full rounded-3xl bg-obsidian-900 border border-gold-500/30 p-8 sm:p-12 shadow-gold-glow text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-obsidian-950 border border-gold-500/40 text-gold-400 flex items-center justify-center mx-auto shadow-gold-glow">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
            Thank You for Choosing Stillness
          </h1>
          <p className="text-xs sm:text-sm text-editorial-subtle leading-relaxed">
            By being present in {brandConfig.name}, you are rejecting surveillance capitalism and helping preserve intentional human communication.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/5 space-y-2 text-left">
          <div className="flex items-center gap-2 text-gold-400 font-mono text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Our Unbreakable Covenant</span>
          </div>
          <p className="text-xs text-editorial-subtle leading-relaxed">
            We will never sell your telemetry, never monetize your attention with algorithmic outrage, and never store plaintext messages on central servers.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('/feed')}
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Return to Gallery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/discover')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 transition-colors cursor-pointer"
          >
            Explore Members
          </button>
        </div>
      </div>
    </div>
  );
};
