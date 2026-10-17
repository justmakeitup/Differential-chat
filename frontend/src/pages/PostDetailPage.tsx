import React, { useState, useEffect } from 'react';
import { api, Post, PostComment, resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  Send,
  Eye,
  Info
} from 'lucide-react';

interface PostDetailPageProps {
  postId: string;
  onNavigate: (path: string) => void;
  onPostDeleted?: () => void;
}

export const PostDetailPage: React.FC<PostDetailPageProps> = ({
  postId,
  onNavigate,
  onPostDeleted
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPost(postId);
      setPost(res.post);
    } catch (err: any) {
      setError(err.message || 'Photograph could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post || !user) {
      addToast({
        type: 'info',
        title: 'Authentication Required',
        message: 'Sign in to appreciate photographs.'
      });
      return;
    }

    const prevLiked = post.has_liked;
    const prevCount = post.likes_count;

    setPost({
      ...post,
      has_liked: !prevLiked,
      likes_count: prevLiked ? prevCount - 1 : prevCount + 1
    });

    try {
      const res = await api.toggleLike(post.id);
      setPost((prev) => (prev ? { ...prev, has_liked: res.liked, likes_count: res.likes_count } : prev));
    } catch {
      setPost((prev) => (prev ? { ...prev, has_liked: prevLiked, likes_count: prevCount } : prev));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !post) return;

    if (!user) {
      addToast({
        type: 'info',
        title: 'Authentication Required',
        message: 'Sign in to leave a reflection on this photograph.'
      });
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.addComment(post.id, commentContent.trim());
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments_count: prev.comments_count + 1,
          comments: [...(prev.comments || []), res.comment]
        };
      });
      setCommentContent('');
      addToast({
        type: 'gold',
        title: 'Reflection Inscribed',
        message: 'Your comment has been attached to the work.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not record comment.'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      await api.deleteComment(post.id, commentId);
      setPost({
        ...post,
        comments_count: Math.max(0, post.comments_count - 1),
        comments: (post.comments || []).filter((c) => c.id !== commentId)
      });
      addToast({
        type: 'info',
        title: 'Comment Removed',
        message: 'Reflection successfully erased.'
      });
    } catch {
      // ignore
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    setDeleting(true);
    try {
      await api.deletePost(post.id);
      addToast({
        type: 'info',
        title: 'Photograph Purged',
        message: 'The work has been permanently expunged from the sanctuary.'
      });
      setShowDeleteModal(false);
      if (onPostDeleted) onPostDeleted();
      onNavigate('/feed');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Purge Failed',
        message: err.message || 'Could not delete photograph.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Link Sealed',
        message: 'Exhibition URL copied to clipboard.'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 text-center">
        <p className="font-mono text-xs text-editorial-subtle animate-pulse">
          Decrypting high-resolution visual payload...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 max-w-md mx-auto text-center space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-white">Work Inaccessible</h2>
        <p className="text-xs text-editorial-subtle leading-relaxed">
          {error || 'This photograph is restricted under connection privacy settings.'}
        </p>
        <button
          onClick={() => onNavigate('/feed')}
          className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SEOHead
        title={post.caption ? `${post.caption.slice(0, 50)}...` : `Photograph by ${post.author?.full_name}`}
        description={post.alt_text}
        image={resolveMediaUrl(post.image_url)}
      />

      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('/feed')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exhibition</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-3xl bg-obsidian-900 border border-white/10 overflow-hidden shadow-2xl">
        {/* Left Column: Image Canvas */}
        <div className="lg:col-span-7 bg-obsidian-950 flex flex-col justify-center items-center p-4 sm:p-8 relative min-h-[450px]">
          <img
            src={resolveMediaUrl(post.image_url)}
            alt={post.alt_text}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.curationSample1;
            }}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
          />

          {/* Accessible Alt Text Drawer beneath image */}
          <div className="mt-4 w-full p-3 rounded-xl bg-obsidian-900/80 border border-white/5 flex items-start gap-2.5">
            <Eye className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-editorial-subtle leading-relaxed">
              <span className="font-mono text-gold-300 font-semibold mr-1.5 uppercase text-[10px]">
                Accessibility Description:
              </span>
              {post.alt_text}
            </div>
          </div>
        </div>

        {/* Right Column: Reflections & Dialogue Stream */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
          <div>
            {/* Author info */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <button
                onClick={() => {
                  if (post.author?.username) onNavigate(`/profile/${post.author.username}`);
                }}
                className="flex items-center gap-3 text-left cursor-pointer hover:opacity-90"
              >
                <img
                  src={resolveMediaUrl(post.author?.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                  alt={post.author?.full_name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                  }}
                  className="w-11 h-11 rounded-xl object-cover ring-1 ring-gold-500/30"
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

              {isOwner && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  aria-label="Delete photograph"
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="py-4 border-b border-white/10">
                <p className="font-serif text-sm text-slate-200 leading-relaxed">
                  {post.caption}
                </p>
                <span className="text-[10px] font-mono text-editorial-muted mt-2 block">
                  Exhibited on {new Date(post.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Interaction Bar */}
            <div className="py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                    post.has_liked ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${post.has_liked ? 'fill-rose-500 text-rose-500' : ''}`}
                  />
                  <span>{post.likes_count}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                aria-label="Share work"
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="mt-4 space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {!post.comments || post.comments.length === 0 ? (
                <p className="text-center py-8 text-xs text-editorial-subtle font-serif italic">
                  No reflections inscribed yet. Offer the first perspective.
                </p>
              ) : (
                post.comments.map((comment) => {
                  const canDeleteComment = user && (user.id === comment.user_id || user.id === post.user_id);
                  return (
                    <div
                      key={comment.id}
                      className="group p-3 rounded-2xl bg-obsidian-950/70 border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (comment.author?.username) onNavigate(`/profile/${comment.author.username}`);
                          }}
                          className="flex items-center gap-2 text-left cursor-pointer"
                        >
                          <img
                            src={resolveMediaUrl(comment.author?.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                            alt={comment.author?.full_name || 'Member'}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                            }}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="font-serif text-xs font-semibold text-white">
                            {comment.author?.full_name}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-editorial-muted">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {canDeleteComment && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans pl-7">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Comment Composer */}
          <form onSubmit={handleAddComment} className="mt-6 pt-4 border-t border-white/10">
            <div className="relative">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={user ? "Inscribe a reflection on this work..." : "Sign in to leave a reflection"}
                disabled={!user || submittingComment}
                className="w-full pl-4 pr-11 py-3 rounded-2xl bg-obsidian-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !commentContent.trim() || submittingComment}
                aria-label="Submit reflection"
                className="absolute right-2 top-2 p-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Expunge Photograph"
        message="This action will permanently delete this photograph and all associated reflections from the sanctuary. It cannot be recovered."
        confirmLabel={deleting ? "Purging..." : "Expunge Forever"}
        isDestructive={true}
        onConfirm={handleDeletePost}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
