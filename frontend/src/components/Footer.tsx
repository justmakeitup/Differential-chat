import React from 'react';
import { brandConfig } from '../config/brandConfig';
import { ShieldCheck, Mail, MapPin, Lock, Terminal } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const addr = brandConfig.businessAddress;

  return (
    <footer className="mt-auto border-t border-white/5 bg-obsidian-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-obsidian-900 border border-gold-500/30 flex items-center justify-center">
              <span className="font-serif font-bold text-gold-400 text-sm">D</span>
            </div>
            <span className="font-serif text-lg font-semibold tracking-wider text-white">
              {brandConfig.name}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-editorial-subtle">
            {brandConfig.subheading}
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Server Message Retention</span>
          </div>
        </div>

        {/* Verified Business Contact */}
        <div className="space-y-3">
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-gold-400">
            Registered Legal Headquarters
          </h4>
          <div className="space-y-2 text-xs text-editorial-subtle leading-relaxed">
            <p className="font-medium text-slate-300">{addr.companyName}</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-gold-500/70 shrink-0 mt-0.5" />
              <span>
                3-3 Golf Green
                <br />
                Kolkata West Bengal
                <br />
                Kolkata 700033
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Mail className="w-3.5 h-3.5 text-gold-500/70 shrink-0" />
              <a
                href="mailto:ranit.das.1321@gmail.com"
                className="hover:text-white transition-colors underline decoration-dotted"
                title="Mail to ranit.das.1321@gmail.com"
              >
                concierge@differential.network
              </a>
            </div>
          </div>
        </div>

        {/* Architecture & Protocols */}
        <div className="space-y-3">
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-gold-400">
            Cryptographic Architecture
          </h4>
          <ul className="space-y-2 text-xs text-editorial-subtle">
            <li className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>ECDH P-256 Key Agreement</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>AES-GCM 256-bit Ephemeral Ratchet</span>
            </li>
            <li className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>WebRTC Direct DataChannels</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>Automated EXIF/GPS Scrubbing</span>
            </li>
          </ul>
        </div>

        {/* Sovereign Governance & Legal */}
        <div className="space-y-3">
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-gold-400">
            Sovereign Governance
          </h4>
          <ul className="space-y-2 text-xs text-editorial-subtle">
            <li>
              <button
                onClick={() => onNavigate('/privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Zero-Knowledge Privacy Charter
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Ethical Terms of Engagement
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  localStorage.removeItem('differential_cookie_consent');
                  window.location.reload();
                }}
                className="hover:text-white transition-colors cursor-pointer text-left"
              >
                Reconfigure Cookie Telemetry
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/thank-you')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Membership Sanctuary Acknowledgments
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-editorial-muted">
        <p>© {new Date().getFullYear()} {brandConfig.name}. An independent privacy-first social connection network.</p>
        <p className="mt-2 sm:mt-0 font-mono">
          Strictly image-only • No algorithmic engagement loops
        </p>
      </div>
    </footer>
  );
};
