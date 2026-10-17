import React from 'react';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { ShieldCheck, Lock, EyeOff, Server, MapPin, Mail } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const addr = brandConfig.businessAddress;

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <SEOHead
        title="Zero-Knowledge Privacy Charter"
        description="Comprehensive privacy charter of Differential. Client-side encryption, zero plaintext retention, and EXIF scrubbing."
      />

      <div className="space-y-4 mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Architecture</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-white">
          Sovereign Privacy Charter
        </h1>
        <p className="text-xs sm:text-sm text-editorial-subtle font-mono">
          Effective Date: October 2026 • Verified Zero-Knowledge Standard
        </p>
      </div>

      <div className="space-y-10 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold-400" />
            1. Zero Plaintext Chat Retention Principle
          </h2>
          <p>
            Unlike conventional networks, {brandConfig.name} does not record, intercept, parse, or store the plaintext content of direct peer dialogues. All one-to-one communications operate across authenticated WebRTC DataChannels with ephemeral or persistent ECDH (Curve P-256) and AES-GCM 256-bit symmetric encryption.
          </p>
          <p>
            The Python Flask backend provides signaling mediation exclusively (relaying SDP Offers, Answers, and ICE NAT candidates). Message contents and cryptographic session keys never touch our servers.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-electric-400" />
            2. Mandatory EXIF and Geolocation Scrubbing
          </h2>
          <p>
            When you exhibit a photograph on {brandConfig.name}, our ingestion service processes the binary stream through a privacy filter. All Exchangeable Image File Format (EXIF) metadata—including GPS latitude and longitude, camera serial numbers, lens specifications, and capture timestamps—is stripped before the image is saved.
          </p>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            3. Account Data & Right to Immediate Erasure (GDPR/CCPA)
          </h2>
          <p>
            We collect only the minimum data required to maintain your membership: email address, username, full name, and your hashed passphrase (salted via scrypt).
          </p>
          <p>
            You possess the unfettered right to terminate and purge your identity at any moment via Settings. Purging an account irrevocably deletes all database records, sessions, connection pairings, and uploaded photographs immediately.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            4. Consent-Based Telemetry & Cookies
          </h2>
          <p>
            We use secure HTTP-Only cookies exclusively for session authentication and CSRF mitigation. Privacy-conscious telemetry is inactive by default and only triggers if you grant explicit permission via our cookie consent dialog. No third-party trackers or cross-site data aggregators are embedded.
          </p>
        </section>

        {/* Business Contact Section */}
        <section className="p-6 rounded-3xl bg-obsidian-950 border border-gold-500/20 space-y-4">
          <h3 className="font-serif text-base font-semibold text-white">
            Data Controller & Legal Verification
          </h3>
          <div className="space-y-1.5 text-xs text-editorial-subtle">
            <p className="font-medium text-slate-200">{addr.companyName}</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>
                {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} {addr.postalCode}, {addr.country}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>Inquiries: {addr.conciergeEmail}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
