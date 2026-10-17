import React, { useState, useEffect } from 'react';
import { api, User } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  Users,
  UserPlus,
  Check,
  Clock,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';

interface DiscoverPageProps {
  onNavigate: (path: string) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [activeRequestUser, setActiveRequestUser] = useState<User | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.discoverUsers({
        q: searchTerm || undefined,
        tag: selectedTag || undefined,
        limit: 30
      });
      setUsers(res.users);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedTag]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestUser) return;

    setSubmittingRequest(true);
    try {
      await api.sendConnectionRequest(activeRequestUser.id, requestNote.trim());
      addToast({
        type: 'gold',
        title: 'Invitation Transmitted',
        message: `Your connection invitation has been sent to ${activeRequestUser.full_name}.`
      });

      // Update state locally
      setUsers((prev) =>
        prev.map((u) =>
          u.id === activeRequestUser.id
            ? { ...u, connection_status: 'pending_sent' }
            : u
        )
      );
      setActiveRequestUser(null);
      setRequestNote('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Transmission Failed',
        message: err.message || 'Could not send connection invitation.'
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEOHead
        title="Discover Discerning Minds"
        description="Search and connect with sovereign photographers, minimalist architects, and independent thinkers."
      />

      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
          Discover Discerning Minds
        </h1>
        <p className="text-xs sm:text-sm text-editorial-subtle">
          An intentional directory of artists, researchers, and creators connected via end-to-end encryption.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="max-w-3xl mx-auto mb-10 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by moniker, location, discipline, or philosophy..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-obsidian-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 shadow-inner-glow"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Curated taxonomy tags scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              !selectedTag
                ? 'bg-gold-500 text-obsidian-950 font-semibold shadow-gold-glow'
                : 'bg-obsidian-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            All Disciplines
          </button>
          {brandConfig.editorialInterests.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                tag === selectedTag
                  ? 'bg-gold-500 text-obsidian-950 font-semibold shadow-gold-glow'
                  : 'bg-obsidian-900 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <CardSkeleton key={n} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Members Found"
          description="Try broadening your search term or exploring different creative disciplines."
          actionText="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedTag('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((member) => {
            const isConnected = member.connection_status === 'connected';
            const isPendingSent = member.connection_status === 'pending_sent';
            const isPendingReceived = member.connection_status === 'pending_received';

            return (
              <div
                key={member.id}
                className="group rounded-3xl bg-obsidian-900/80 hover:bg-obsidian-900 border border-white/10 hover:border-gold-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl"
              >
                <div>
                  {/* Top Bar: Avatar & Privacy Badge */}
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => onNavigate(`/profile/${member.username}`)}
                      className="flex items-center gap-3 text-left cursor-pointer group-hover:opacity-90"
                    >
                      <div className="relative">
                        <img
                          src={member.avatar_url || brandConfig.sampleImages.defaultAvatar}
                          alt={member.full_name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gold-500/30 group-hover:ring-gold-400 transition-all"
                        />
                        {member.is_verified && (
                          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-gold-500 text-obsidian-950">
                            <Sparkles className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-semibold text-white group-hover:text-gold-200 transition-colors">
                          {member.full_name}
                        </h3>
                        <p className="font-mono text-[11px] text-editorial-subtle">@{member.username}</p>
                      </div>
                    </button>

                    {/* Privacy indicator */}
                    <div className="p-1.5 rounded-lg bg-obsidian-950 border border-white/5 text-slate-400">
                      {member.privacy_mode === 'connections_only' ? (
                        <span title="Restricted to Connections">
                          <Lock className="w-3.5 h-3.5 text-electric-400" />
                        </span>
                      ) : (
                        <span title="Public Directory">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Headline & Location */}
                  <p className="mt-4 text-xs font-medium text-gold-300/90 leading-snug">
                    {member.headline || 'Independent Creator'}
                  </p>

                  {member.location && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{member.location}</span>
                    </p>
                  )}

                  {/* Bio */}
                  {member.bio && (
                    <p className="mt-3 text-xs text-editorial-subtle line-clamp-3 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Interests Chips */}
                  {member.interests && member.interests.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {member.interests.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-obsidian-950 text-[10px] font-mono text-slate-300 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                      {member.interests.length > 3 && (
                        <span className="text-[10px] font-mono text-editorial-muted self-center">
                          +{member.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate(`/profile/${member.username}`)}
                    className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    View Exhibition →
                  </button>

                  {user && (
                    <>
                      {isConnected ? (
                        <button
                          onClick={() => onNavigate(`/chat?peer=${member.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-electric-600 hover:bg-electric-500 text-white shadow-electric-glow transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>P2P Chat</span>
                        </button>
                      ) : isPendingSent ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 bg-obsidian-950 border border-white/10">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      ) : isPendingReceived ? (
                        <button
                          onClick={() => onNavigate('/connections')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Respond</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveRequestUser(member)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invitation Modal */}
      {activeRequestUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-3xl bg-obsidian-900 border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <img
                src={activeRequestUser.avatar_url || brandConfig.sampleImages.defaultAvatar}
                alt={activeRequestUser.full_name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-gold-500/40"
              />
              <div>
                <h3 className="font-serif text-sm font-semibold text-white">
                  Connect with {activeRequestUser.full_name}
                </h3>
                <p className="text-[11px] text-editorial-subtle font-mono">
                  Direct zero-knowledge connection
                </p>
              </div>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Introductory Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Share what drew you to their visual work or philosophical focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRequestUser(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingRequest ? 'Transmitting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
