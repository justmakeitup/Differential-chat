import React, { useState, useEffect } from 'react';
import { api, User, Post } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { ProfileSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Sparkles,
  MapPin,
  Lock,
  Globe,
  EyeOff,
  UserPlus,
  MessageSquare,
  Clock,
  Heart,
  MessageCircle,
  Calendar,
  Share2,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ProfilePageProps {
  username: string;
  onNavigate: (path: string) => void;
  onOpenPost: (postId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ username, onNavigate, onOpenPost }) => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<(User & { posts: Post[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [sendingRequest, setSendingRequest] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUserProfile(username);
      setProfile(res.profile);
    } catch (err: any) {
      setError(err.message || 'Profile not found or access restricted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleConnect = async () => {
    if (!profile) return;
    setSendingRequest(true);
    try {
      await api.sendConnectionRequest(profile.id);
      addToast({
        type: 'gold',
        title: 'Invitation Transmitted',
        message: `Connection request dispatched to ${profile.full_name}.`
      });
      setProfile((prev) => (prev ? { ...prev, connection_status: 'pending_sent' } : prev));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'Unable to send invitation.'
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Link Sealed',
        message: 'Profile URL copied to clipboard.'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-obsidian-900 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-white">Veiled Sanctuary</h2>
        <p className="text-xs text-editorial-subtle leading-relaxed">
          {error || 'This member profile is sealed under sovereign privacy controls.'}
        </p>
        <button
          onClick={() => onNavigate('/discover')}
          className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.id === profile.id;
  const isConnected = profile.connection_status === 'connected';
  const isPendingSent = profile.connection_status === 'pending_sent';
  const isPendingReceived = profile.connection_status === 'pending_received';

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <SEOHead
        title={`${profile.full_name} (@${profile.username})`}
        description={profile.headline || profile.bio || `Explore curated photography by ${profile.full_name} on Differential.`}
        image={profile.avatar_url || brandConfig.sampleImages.defaultAvatar}
      />

      {/* Profile Header Card */}
      <div className="rounded-3xl bg-obsidian-900 border border-white/10 overflow-hidden shadow-2xl relative">
        {/* Banner */}
        <div className="h-48 sm:h-64 w-full relative bg-obsidian-950">
          <img
            src={profile.banner_url || brandConfig.sampleImages.defaultBanner}
            alt="Profile backdrop"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/40 to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-10 pb-8 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.avatar_url || brandConfig.sampleImages.defaultAvatar}
                alt={profile.full_name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-obsidian-900 shadow-2xl bg-obsidian-950"
              />
              {profile.is_verified && (
                <div
                  title="Verified Sovereign Member"
                  className="absolute bottom-1 right-1 p-1.5 rounded-xl bg-gold-500 text-obsidian-950 shadow-gold-glow"
                >
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Actions on the right */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleShareProfile}
                aria-label="Share profile link"
                className="p-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {isOwner ? (
                <button
                  onClick={() => onNavigate('/settings')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-obsidian-800 hover:bg-obsidian-700 text-white border border-white/10 transition-colors cursor-pointer"
                >
                  Edit Profile & Privacy
                </button>
              ) : currentUser ? (
                isConnected ? (
                  <button
                    onClick={() => onNavigate(`/chat?peer=${profile.id}`)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-electric-600 hover:bg-electric-500 text-white shadow-electric-glow transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Encrypted Channel</span>
                  </button>
                ) : isPendingSent ? (
                  <span className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono text-slate-400 bg-obsidian-800 border border-white/10">
                    <Clock className="w-4 h-4" />
                    <span>Invitation Pending</span>
                  </span>
                ) : isPendingReceived ? (
                  <button
                    onClick={() => onNavigate('/connections')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Respond to Invitation</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={sendingRequest}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{sendingRequest ? 'Transmitting...' : 'Connect'}</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => onNavigate('/signup')}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
                >
                  Join to Connect
                </button>
              )}
            </div>
          </div>

          {/* Name & Headline */}
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {profile.full_name}
              </h1>
              <div className="px-2.5 py-0.5 rounded-full bg-obsidian-950 text-[10px] font-mono text-gold-400 border border-gold-500/20">
                {profile.privacy_mode === 'connections_only' ? 'Connections Only' : 'Public Profile'}
              </div>
            </div>
            <p className="font-mono text-xs text-editorial-subtle">@{profile.username}</p>
            {profile.headline && (
              <p className="text-sm font-medium text-gold-300/90 pt-1">
                {profile.headline}
              </p>
            )}
          </div>

          {/* Location & Join date */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
            </div>
            {profile.e2ee_public_key && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>E2EE Node Verified</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-xl bg-obsidian-950 text-xs font-mono text-slate-300 border border-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="px-6 sm:px-10 border-t border-white/10 flex items-center gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 text-xs font-semibold tracking-wider uppercase transition-colors relative cursor-pointer ${
              activeTab === 'posts' ? 'text-gold-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Exhibitions ({profile.posts ? profile.posts.length : 0})</span>
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400 rounded-full shadow-gold-glow" />
            )}
          </button>
        </div>
      </div>

      {/* Exhibitions Gallery Grid */}
      <div className="mt-8">
        {profile.is_restricted ? (
          <div className="p-12 text-center rounded-3xl bg-obsidian-900 border border-white/10 space-y-3">
            <Lock className="w-8 h-8 text-electric-400 mx-auto" />
            <h3 className="font-serif text-lg font-semibold text-white">Exhibition Veiled</h3>
            <p className="text-xs text-editorial-subtle max-w-sm mx-auto">
              {profile.full_name} has restricted their gallery to mutual established connections.
            </p>
          </div>
        ) : !profile.posts || profile.posts.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No Exhibited Works Yet"
            description={
              isOwner
                ? "You haven't published any photographs to your portfolio yet."
                : "This member has not yet published any photographs."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.posts.map((post) => (
              <div
                key={post.id}
                onClick={() => onOpenPost(post.id)}
                className="group relative rounded-2xl overflow-hidden bg-obsidian-900 border border-white/10 cursor-pointer aspect-square shadow-xl transition-all hover:border-gold-500/40"
              >
                <img
                  src={post.image_url}
                  alt={post.alt_text}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-obsidian-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                  <div className="flex justify-end">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-obsidian-900/90 text-gold-300 border border-gold-500/30">
                      {post.privacy_level === 'connections_only' ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <div>
                    {post.caption && (
                      <p className="text-xs font-serif line-clamp-2 text-slate-200">
                        {post.caption}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-electric-400" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
