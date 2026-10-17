import React from 'react';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { ShieldCheck, Copyright, VideoOff, HeartHandshake } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SEOHead
        title="Ethical Terms of Engagement"
        description="The terms governing participation in the Differential sanctuary. Artistic copyright ownership and image-only standards."
      />

      <div className="space-y-4 mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ethical Covenant</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-white">
          Terms of Engagement
        </h1>
        <p className="text-xs sm:text-sm text-editorial-subtle font-mono">
          A pact among discerning creators and independent thinkers
        </p>
      </div>

      <div className="space-y-10 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
        {/* Term 1: Image-Only Standard */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <VideoOff className="w-4 h-4 text-rose-400" />
            1. Strict Image-Only Exhibition Policy
          </h2>
          <p>
            {brandConfig.name} is dedicated exclusively to static photographic and visual art. Video uploads are explicitly prohibited and blocked at both client and API gateway levels. Members agree not to attempt to circumvent file validation systems to upload animations, short-form reels, or video streams.
          </p>
        </section>

        {/* Term 2: Copyright Ownership */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <Copyright className="w-4 h-4 text-gold-400" />
            2. 100% Artist Copyright Retention
          </h2>
          <p>
            You retain 100% of the copyright and intellectual property rights to every photograph you exhibit on {brandConfig.name}. We do not claim ownership, do not license your images to third parties, and do not use your visual work to train generative machine learning models without explicit bilateral consent.
          </p>
        </section>

        {/* Term 3: Respectful Community & Anti-Harassment */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-electric-400" />
            3. Sovereign Respect & Anti-Harassment
          </h2>
          <p>
            Communication within the sanctuary must remain respectful and consensual. Unsolicited spam, harassment, hate speech, non-consensual imagery, and illegal content are grounds for immediate and permanent membership termination.
          </p>
        </section>

        {/* Term 4: Mandatory Alt-Text Standard */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            4. Accessibility & Meaningful Alt-Text
          </h2>
          <p>
            To honor universal human access, descriptive alt-text is required for every uploaded photograph. Members commit to crafting thoughtful descriptions to ensure that visually impaired peers can participate equally in the sanctuary.
          </p>
        </section>
      </div>
    </div>
  );
};
