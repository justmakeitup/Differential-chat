import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { ConfirmModal } from '../components/ConfirmModal';
import { getOrCreateIdentityKeyPair } from '../services/crypto';
import {
  Shield,
  KeyRound,
  Lock,
  Globe,
  EyeOff,
  Smartphone,
  Trash2,
  RefreshCw,
  Download,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Radio,
  Server
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getApiBaseUrl, setCustomApiHost } from '../services/api';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, refreshUser, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'privacy' | 'appearance' | 'keys' | 'sessions' | 'security' | 'server' | 'danger'>('privacy');

  // Mobile App Server Configuration
  const [serverHost, setServerHost] = useState(() => {
    return getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  });

  // Privacy controls
  const [privacyMode, setPrivacyMode] = useState<'public' | 'connections_only' | 'incognito'>(
    user?.privacy_mode || 'public'
  );
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // E2EE Keys
  const [fingerprint, setFingerprint] = useState('');
  const [publicKeyBase64, setPublicKeyBase64] = useState('');

  // Active sessions
  const [sessions, setSessions] = useState<Array<{ id: string; ip_address: string; user_agent: string; last_active: string }>>([]);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Load local crypto key data
    getOrCreateIdentityKeyPair().then(({ data }) => {
      setFingerprint(data.fingerprint);
      setPublicKeyBase64(data.publicKeyBase64);
    });

    // Load active sessions
    api.getSessions().then((res) => {
      setSessions(res.sessions);
    }).catch(() => {});
  }, []);

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      await api.updateProfile({ privacy_mode: privacyMode });
      await refreshUser();
      addToast({
        type: 'gold',
        title: 'Privacy Spheres Updated',
        message: 'Your visibility settings have been cryptographically updated.'
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Update Error',
        message: 'Failed to update privacy controls.'
      });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleRegenerateKeys = async () => {
    localStorage.removeItem('aetheris_identity_keys');
    const { data } = await getOrCreateIdentityKeyPair();
    setFingerprint(data.fingerprint);
    setPublicKeyBase64(data.publicKeyBase64);

    try {
      await api.updateProfile({ e2ee_public_key: data.publicKeyBase64 });
      await refreshUser();
      addToast({
        type: 'gold',
        title: 'Keypair Regenerated',
        message: 'Fresh ECDH P-256 identity keypair issued and sealed.'
      });
    } catch {
      // ignore
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addToast({
        type: 'info',
        title: 'Session Terminated',
        message: 'The remote session was securely revoked.'
      });
    } catch {
      // ignore
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setChangingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      addToast({
        type: 'gold',
        title: 'Passphrase Updated',
        message: 'Your account master credentials have been rotated.'
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Current password incorrect or new password does not meet requirements.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      localStorage.clear();
      addToast({
        type: 'info',
        title: 'Account Purged',
        message: 'Your account, photographs, and sessions have been permanently deleted.'
      });
      await logout();
      onNavigate('/');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Error',
        message: err.message || 'Could not delete account.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <SEOHead
        title="Settings & Privacy Controls"
        description="Configure your sovereign privacy spheres, cryptographic identity keys, and active sessions."
      />

      <div className="mb-10">
        <h1 className="font-serif text-3xl font-semibold text-white">
          Settings & Sovereignty
        </h1>
        <p className="text-xs text-editorial-subtle mt-1">
          Full control over your visibility, cryptographic identity, and personal telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-1.5">
          <button
            onClick={() => setActiveSection('privacy')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'privacy'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy Spheres</span>
          </button>

          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'appearance'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveSection('keys')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'keys'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Cryptographic Keys (E2EE)</span>
          </button>

          <button
            onClick={() => setActiveSection('sessions')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'sessions'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Active Sessions</span>
          </button>

          <button
            onClick={() => setActiveSection('security')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'security'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Passphrase</span>
          </button>

          <button
            onClick={() => setActiveSection('server')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'server'
                ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-slate-300 hover:bg-white/5 bg-obsidian-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Mobile App Node & Server</span>
          </button>

          <button
            onClick={() => setActiveSection('danger')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeSection === 'danger'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-rose-400 hover:bg-rose-500/10 bg-obsidian-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Account</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8 rounded-3xl bg-obsidian-900 border border-white/10 p-6 sm:p-8 shadow-2xl">
          {/* Section 1: Privacy Spheres */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Visibility Spheres
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Control how your profile and artworks are discoverable across the network.
                </p>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setPrivacyMode('public')}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    privacyMode === 'public'
                      ? 'bg-gold-500/10 border-gold-500/40 text-gold-300'
                      : 'bg-obsidian-950 border-white/5 hover:border-white/15'
                  }`}
                >
                  <Globe className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-xs">Public Discoverability</p>
                    <p className="text-[11px] text-editorial-subtle mt-0.5">
                      Listed in search and discover. Anyone can request a connection.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPrivacyMode('connections_only')}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    privacyMode === 'connections_only'
                      ? 'bg-electric-500/10 border-electric-500/40 text-electric-300'
                      : 'bg-obsidian-950 border-white/5 hover:border-white/15'
                  }`}
                >
                  <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-xs">Connections Only</p>
                    <p className="text-[11px] text-editorial-subtle mt-0.5">
                      Your photographic exhibitions are locked to confirmed mutual connections.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPrivacyMode('incognito')}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    privacyMode === 'incognito'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-obsidian-950 border-white/5 hover:border-white/15'
                  }`}
                >
                  <EyeOff className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-xs">Incognito Mode</p>
                    <p className="text-[11px] text-editorial-subtle mt-0.5">
                      Invisible in all search lists. Only people you initiate contact with can discover you.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSavePrivacy}
                  disabled={savingPrivacy}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow cursor-pointer disabled:opacity-50"
                >
                  {savingPrivacy ? 'Applying...' : 'Save Visibility Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Section: Appearance & Theme */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Appearance & Editorial Ambience
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Choose between our signature dark cinematic sanctuary and the refined ivory gallery light mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dark Mode Card */}
                <div
                  onClick={() => {
                    setTheme('dark');
                    addToast({
                      type: 'gold',
                      title: 'Dark Mode Active',
                      message: 'Obsidian & charcoal canvas restored.'
                    });
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-obsidian-950 border-gold-500/50 shadow-gold-glow ring-1 ring-gold-400/30'
                      : 'bg-obsidian-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-obsidian-850 border border-white/10 flex items-center justify-center text-gold-400">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gold-500/20 text-gold-300 border border-gold-500/40">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-white">Obsidian Cinematic (Dark)</h4>
                  <p className="text-xs text-editorial-subtle mt-1">
                    Deep charcoal and obsidian canvas with imperial gold and electric-indigo accents.
                  </p>
                </div>

                {/* Light Mode Card */}
                <div
                  onClick={() => {
                    setTheme('light');
                    addToast({
                      type: 'gold',
                      title: 'Classy Light Mode Active',
                      message: 'Architectural white gallery canvas engaged.'
                    });
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'bg-white border-gold-500/60 shadow-lg ring-1 ring-gold-400/30'
                      : 'bg-slate-100/90 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-600">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-gold-500 text-white border border-gold-600">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-slate-900">White Classy Gallery (Light)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Pristine ivory and architectural marble white with high-contrast editorial typography.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Cryptographic Keys */}
          {activeSection === 'keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Cryptographic Identity
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Client-side Web Crypto keypairs (ECDH Curve P-256) used to negotiate peer-to-peer AES-GCM data channels.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-wider block">
                  Active Safety Fingerprint
                </span>
                <p className="font-mono text-sm font-bold text-white tracking-widest bg-obsidian-900 p-3 rounded-xl border border-white/5 select-all">
                  {fingerprint}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-editorial-subtle uppercase tracking-wider block">
                  Exported Public Key SPKI (Base64)
                </span>
                <p className="font-mono text-[11px] text-slate-300 bg-obsidian-900 p-3 rounded-xl border border-white/5 break-all select-all">
                  {publicKeyBase64}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <button
                  onClick={handleRegenerateKeys}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 border border-white/10 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Keypair</span>
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({ fingerprint, publicKeyBase64 }, null, 2)], {
                      type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `aetheris-identity-${user?.username}.json`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-electric-600 hover:bg-electric-500 text-white shadow-electric-glow transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup Key</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Sessions */}
          {activeSection === 'sessions' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Active Cryptographic Sessions
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Active devices holding authenticated tokens. You may revoke any session immediately.
                </p>
              </div>

              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-obsidian-900 border border-white/5 text-slate-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white font-mono">
                          {sess.ip_address || 'Current Node'}
                        </p>
                        <p className="text-[11px] text-editorial-subtle max-w-xs truncate">
                          {sess.user_agent || 'Modern Web Browser'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Security & Passphrase */}
          {activeSection === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Change Master Password
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Update your authentication secret. Must meet strength standards.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  New Master Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 uppercase, 1 symbol..."
                  className="w-full px-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow cursor-pointer disabled:opacity-50"
                >
                  {changingPassword ? 'Hashing...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* Section: Mobile App Node & Server */}
          {activeSection === 'server' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  Mobile Application Node Connection
                </h3>
                <p className="text-xs text-editorial-subtle mt-1">
                  Configure the backend server endpoint for the Android native application.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex items-start gap-3">
                <Radio className="w-5 h-5 text-electric-400 shrink-0 mt-0.5" />
                <div className="text-xs text-electric-200">
                  <p className="font-semibold text-white">Zero-Knowledge Decentralized Connectivity</p>
                  <p className="mt-1 leading-relaxed">
                    By default on Android emulators, this app reaches <code className="text-gold-400 bg-obsidian-950 px-1.5 py-0.5 rounded">http://10.0.2.2:5000</code>. On physical Android devices connected via Wi-Fi or LAN, specify your computer's local IP (e.g. <code className="text-gold-400 bg-obsidian-950 px-1.5 py-0.5 rounded">http://192.168.1.X:5000</code>) or your production domain.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-200">
                  Active Server API URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={serverHost}
                    onChange={(e) => setServerHost(e.target.value)}
                    placeholder="e.g. http://192.168.1.15:5000 or http://10.0.2.2:5000"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono"
                  />
                  <button
                    onClick={() => {
                      setCustomApiHost(serverHost.trim());
                      addToast({
                        type: 'gold',
                        title: 'Server Node Saved',
                        message: 'API & WebRTC signaling endpoint updated for this client.'
                      });
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow cursor-pointer"
                  >
                    Save URL
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setServerHost('http://10.0.2.2:5000');
                      setCustomApiHost('http://10.0.2.2:5000');
                      addToast({ type: 'info', title: 'Preset Applied', message: 'Configured for Android Emulator (10.0.2.2:5000)' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-white/10 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    Emulator Default (10.0.2.2:5000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerHost('');
                      setCustomApiHost('');
                      addToast({ type: 'info', title: 'Preset Applied', message: 'Reset to standard browser relative origin' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-white/10 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    Default Web Origin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Danger Zone */}
          {activeSection === 'danger' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-serif text-sm font-semibold">Irreversible Account Deletion</h4>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  Purging your account will immediately and permanently delete your profile, photographic exhibitions, comments, mutual connections, and cryptographic identity keys from the database.
                </p>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                Permanently Purge My Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Permanent Deletion"
        message="Are you completely certain? All your uploaded photographs and cryptographic relationships will be erased immediately. This operation cannot be undone."
        confirmLabel={deleting ? "Purging..." : "Confirm & Purge Everything"}
        isDestructive={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
