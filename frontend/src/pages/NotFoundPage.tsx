import React from 'react';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { Compass, ArrowRight } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      <SEOHead
        title="404 - Node Not Found"
        description="The requested sanctuary coordinate does not exist or has dissolved into the ether."
      />

      {/* Background drifting astral particles */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-electric-600/10 blur-[130px] rounded-full pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gold-500/10 blur-[120px] rounded-full pointer-events-none animate-float" />

      <div className="max-w-md w-full rounded-3xl bg-obsidian-900/90 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 shadow-2xl text-center space-y-6 relative z-10">
        <div className="relative inline-block animate-float">
          <div className="w-20 h-20 rounded-3xl bg-obsidian-950 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto shadow-gold-glow">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-electric-500 text-white font-mono text-[10px] font-bold">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
            Lost in the Ether
          </h1>
          <p className="text-xs sm:text-sm text-editorial-subtle leading-relaxed">
            The cryptographic coordinates you requested do not correlate to any valid channel or exhibition.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="px-8 py-3.5 rounded-2xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Return to Sanctuary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
