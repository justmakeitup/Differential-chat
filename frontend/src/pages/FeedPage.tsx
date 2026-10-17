import React, { useState, useEffect } from 'react';
import { api, Post, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Globe,
  Sparkles,
  PlusSquare,
  ShieldCheck,
  Eye,
  Trash2
} from 'lucide-react';

interface FeedPageProps {
  onNavigate: (path: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenComposer: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onNavigate,
  onOpenPost,
  onOpenComposer
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [feedType, setFeedType] = useState<'discover' | 'connections'>('discover');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingMap, setLikingMap] = useState<Record<string, boolean>>({});

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await api.getFeed(feedType);
      setPosts(res.posts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [feedType]);

  const handleToggleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      addToast({
        type: 'info',
        title: 'Authentication Required',
        message: 'Sign in to appreciate photographs.'
      });
      return;
    }

    if (likingMap[post.id]) return;
    setLikingMap((prev) => ({ ...prev, [post.id]: true }));

    // Optimistic update
    const prevLiked = post.has_liked;
    const prevCount = post.likes_count;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              has_liked: !prevLiked,
              likes_count: prevLiked ? prevCount - 1 : prevCount + 1
            }
          : p
      )
    );

    try {
      const res = await api.toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, has_liked: res.liked, likes_count: res.likes_count }
            : p
        )
      );
    } catch {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, has_liked: prevLiked, likes_count: prevCount }
            : p
        )
      );
    } finally {
      setLikingMap((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const handleShare = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      addToast({
        type: 'info',
        title: 'Exhibition Link Sealed',
        message: 'Link to this photograph copied to clipboard.'
      });
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <SEOHead
        title="Sanctuary Exhibition"
        description="A curated stream of image-only contemplative art and photography. Stripped of metadata and algorithmic noise."
      />

      {/* Feed Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
            Exhibition Gallery
          </h1>
          <p className="text-xs text-editorial-subtle mt-0.5">
            Image-only works • Zero algorithmic ranking • Pure chronological curation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Feed Filter Toggle */}
          <div className="p-1 rounded-2xl bg-obsidian-900 border border-white/10 flex items-center">
            <button
              onClick={() => setFeedType('discover')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                feedType === 'discover'
                  ? 'bg-gold-500 text-obsidian-950 font-semibold shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Public Exhibition
            </button>
            {user && (
              <button
                onClick={() => setFeedType('connections')}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  feedType === 'connections'
                    ? 'bg-gold-500 text-obsidian-950 font-semibold shadow-gold-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Connections Only
              </button>
            )}
          </div>

          {user && (
            <button
              onClick={onOpenComposer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer transition-all"
            >
              <PlusSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Exhibit Work</span>
            </button>
          )}
        </div>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="space-y-8 max-w-2xl mx-auto">
          {[1, 2, 3].map((n) => (
            <CardSkeleton key={n} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={feedType === 'connections' ? 'No Connection Works Yet' : 'The Gallery is Quiet'}
          description={
            feedType === 'connections'
              ? 'Connect with other artists in Discover to experience their private exhibitions.'
              : 'Be the first to exhibit a photograph in the sanctuary.'
          }
          actionText={user ? 'Publish Photograph' : 'Request Access'}
          onAction={user ? onOpenComposer : () => onNavigate('/signup')}
        />
      ) : (
        <div className="space-y-10 max-w-2xl mx-auto">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onOpenPost(post.id)}
              className="rounded-3xl bg-obsidian-900 border border-white/10 hover:border-gold-500/25 overflow-hidden shadow-2xl transition-all cursor-pointer"
            >
              {/* Post Author Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.author?.username) onNavigate(`/profile/${post.author.username}`);
                  }}
                  className="flex items-center gap-3 text-left hover:opacity-90 cursor-pointer"
                >
                  <img
                    src={resolveMediaUrl(post.author?.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                    alt={post.author?.full_name || 'Author'}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                    }}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-gold-500/30 shrink-0 aspect-square min-w-[40px] min-h-[40px]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-sm font-semibold text-white">
                        {post.author?.full_name}
                      </span>
                      {post.author?.is_verified && (
                        <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-editorial-subtle">
                      @{post.author?.username}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-editorial-muted">
                    {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <div
                    title={post.privacy_level === 'connections_only' ? 'Connections Only' : 'Public'}
                    className="p-1 rounded-lg bg-obsidian-950 border border-white/5 text-slate-400"
                  >
                    {post.privacy_level === 'connections_only' ? (
                      <Lock className="w-3 h-3 text-electric-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* The Curated Image */}
              <div className="relative bg-obsidian-950 overflow-hidden flex items-center justify-center">
                <img
                  src={resolveMediaUrl(post.image_url)}
                  alt={post.alt_text}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.curationSample1;
                  }}
                  className="w-full max-h-[650px] object-contain hover:scale-[1.01] transition-transform duration-500"
                />
              </div>

              {/* Post Details & Interactions */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Actions row */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleToggleLike(post, e)}
                      aria-label={post.has_liked ? "Unappreciate work" : "Appreciate work"}
                      className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                        post.has_liked ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${post.has_liked ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                      <span>{post.likes_count}</span>
                    </button>

                    <button
                      onClick={() => onOpenPost(post.id)}
                      aria-label="View comments"
                      className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments_count}</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleShare(post, e)}
                    aria-label="Share work"
                    className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Caption */}
                {post.caption && (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                    {post.caption}
                  </p>
                )}

                {/* Accessible Alt-Text Reader Pill */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded-md bg-obsidian-950 border border-white/5 text-[10px] font-mono text-gold-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>ALT</span>
                  </div>
                  <span className="text-[11px] text-editorial-subtle truncate italic">
                    "{post.alt_text}"
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
