import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings, Check } from 'lucide-react';
import { getStoredCookiePreferences, saveCookiePreferences, CookiePreferences } from '../services/analytics';

export const CookieBanner: React.FC = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(getStoredCookiePreferences());
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Only open if the user hasn't made a choice yet
    if (!preferences.decided) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [preferences.decided]);

  const handleAcceptAll = () => {
    const updated = saveCookiePreferences({
      essential: true,
      analytics: true,
      personalization: true
    });
    setPreferences(updated);
    setIsOpen(false);
  };

  const handleAcceptEssentialOnly = () => {
    const updated = saveCookiePreferences({
      essential: true,
      analytics: false,
      personalization: false
    });
    setPreferences(updated);
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    const updated = saveCookiePreferences(preferences);
    setPreferences(updated);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300"
    >
      <div className="bg-obsidian-900/95 backdrop-blur-xl border border-editorial-border-gold shadow-2xl rounded-2xl p-6 text-white text-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base font-medium tracking-wide text-white">
              Sovereign Privacy Consent
            </h3>
            <p className="mt-1 text-xs text-editorial-subtle leading-relaxed">
              Differential operates on zero-knowledge cryptographic foundations. We never deploy cross-site trackers or sell personal data. Choose your telemetry preferences below.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian-800/80 border border-white/5">
              <div>
                <p className="font-medium text-xs text-white">Strictly Essential</p>
                <p className="text-[11px] text-editorial-subtle">Cryptographic signaling & secure session tokens.</p>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-editorial-subtle">
                Always Active
              </span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian-800/80 border border-white/5 cursor-pointer hover:border-gold-500/30 transition-colors">
              <div>
                <p className="font-medium text-xs text-white">Privacy-First Telemetry</p>
                <p className="text-[11px] text-editorial-subtle">Anonymous page counts to help maintain node health.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 text-electric-600 focus:ring-electric-500 bg-obsidian-950"
              />
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!showDetails ? (
            <>
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2 text-xs font-medium bg-gold-500 hover:bg-gold-400 text-obsidian-950 rounded-xl transition-all shadow-gold-glow cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleAcceptEssentialOnly}
                className="px-3 py-2 text-xs font-medium bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                onClick={() => setShowDetails(true)}
                aria-label="Customize cookie settings"
                className="p-2 text-editorial-subtle hover:text-white transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveCustom}
                className="flex-1 px-4 py-2 text-xs font-medium bg-electric-600 hover:bg-electric-500 text-white rounded-xl transition-all shadow-electric-glow cursor-pointer"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
