import React, { useState, useEffect } from 'react';
import { api, ConnectionItem, ConnectionRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Users,
  MessageSquareLock,
  Check,
  X,
  UserX,
  Sparkles,
  Lock,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ConnectionsPageProps {
  onNavigate: (path: string) => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'mutual' | 'received' | 'sent'>('mutual');
  const [activeConnections, setActiveConnections] = useState<ConnectionItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Disconnect modal state
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<ConnectionItem | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await api.getConnections();
      setActiveConnections(res.active);
      setReceivedRequests(res.received);
      setSentRequests(res.sent);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAccept = async (requestId: string, requesterName: string) => {
    try {
      await api.acceptConnection(requestId);
      addToast({
        type: 'gold',
        title: 'Connection Sealed',
        message: `You are now mutually connected with ${requesterName}. Encrypted channels ready.`
      });
      fetchConnections();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Acceptance Error',
        message: err.message || 'Could not accept connection.'
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await api.declineConnection(requestId);
      addToast({
        type: 'info',
        title: 'Invitation Dismissed',
        message: 'The connection request has been declined.'
      });
      fetchConnections();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Error',
        message: err.message || 'Could not decline invitation.'
      });
    }
  };

  const handleDisconnect = async () => {
    if (!connectionToDisconnect) return;
    try {
      await api.removeConnection(connectionToDisconnect.connection_id);
      addToast({
        type: 'info',
        title: 'Connection Severed',
        message: 'Mutual connection and cryptographic pairing removed.'
      });
      setConnectionToDisconnect(null);
      fetchConnections();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <SEOHead
        title="Sanctuary Connections"
        description="Manage your mutual connections, pending invitations, and encrypted peer-to-peer dialogues."
      />

      <div className="max-w-2xl mx-auto text-center mb-10 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
          Sovereign Peer Connections
        </h1>
        <p className="text-xs sm:text-sm text-editorial-subtle">
          Direct human alliances with end-to-end encrypted messaging channels.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('mutual')}
          className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === 'mutual'
              ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
              : 'text-slate-400 hover:text-white bg-obsidian-900'
          }`}
        >
          Established Peers ({activeConnections.length})
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`relative px-5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
              : 'text-slate-400 hover:text-white bg-obsidian-900'
          }`}
        >
          <span>Received Invitations</span>
          {receivedRequests.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-electric-500 text-white">
              {receivedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
              : 'text-slate-400 hover:text-white bg-obsidian-900'
          }`}
        >
          Transmitted ({sentRequests.length})
        </button>
      </div>

      {/* Tab 1: Mutual Active Connections */}
      {activeTab === 'mutual' && (
        <div className="space-y-4">
          {activeConnections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Established Connections"
              description="Explore the Discover directory to connect with other photographers and thinkers."
              actionText="Discover Members"
              onAction={() => onNavigate('/discover')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeConnections.map(({ connection_id, peer, since }) => (
                <div
                  key={connection_id}
                  className="rounded-2xl bg-obsidian-900/80 border border-white/10 hover:border-gold-500/30 p-5 flex items-start justify-between gap-4 transition-all"
                >
                  <button
                    onClick={() => onNavigate(`/profile/${peer.username}`)}
                    className="flex items-start gap-3.5 text-left cursor-pointer group"
                  >
                    <img
                      src={peer.avatar_url || brandConfig.sampleImages.defaultAvatar}
                      alt={peer.full_name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-gold-500/30 group-hover:ring-gold-400 transition-all shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif text-sm font-semibold text-white group-hover:text-gold-200 transition-colors">
                          {peer.full_name}
                        </span>
                        {peer.is_verified && <Sparkles className="w-3 h-3 text-gold-400" />}
                      </div>
                      <span className="text-[11px] font-mono text-editorial-subtle">
                        @{peer.username}
                      </span>
                      {peer.headline && (
                        <p className="text-xs text-slate-300 mt-1 line-clamp-1">{peer.headline}</p>
                      )}
                      <span className="text-[10px] font-mono text-editorial-muted mt-2 block">
                        Connected {since ? new Date(since).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'recently'}
                      </span>
                    </div>
                  </button>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate(`/chat?peer=${peer.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-electric-600 hover:bg-electric-500 text-white shadow-electric-glow transition-all cursor-pointer"
                    >
                      <MessageSquareLock className="w-3.5 h-3.5" />
                      <span>Encrypted P2P</span>
                    </button>
                    <button
                      onClick={() => setConnectionToDisconnect({ connection_id, peer, since })}
                      className="flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg cursor-pointer"
                      title="Disconnect Peer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Received Requests */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Pending Invitations"
              description="You have reviewed all incoming connection requests."
            />
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-obsidian-900 border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={req.requester?.avatar_url || brandConfig.sampleImages.defaultAvatar}
                      alt={req.requester?.full_name || 'Requester'}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-gold-500/30 shrink-0"
                    />
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-white">
                        {req.requester?.full_name}
                      </h4>
                      <p className="font-mono text-[11px] text-editorial-subtle">
                        @{req.requester?.username}
                      </p>
                      {req.note && (
                        <p className="mt-2 text-xs text-slate-300 italic bg-obsidian-950 p-2.5 rounded-xl border border-white/5">
                          "{req.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-obsidian-800 hover:bg-obsidian-750 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(req.id, req.requester?.full_name || 'Member')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-obsidian-950 shadow-gold-glow transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Invitation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Outgoing Invitations"
              description="You have no pending invitations awaiting member confirmation."
            />
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-obsidian-900 border border-white/10 p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={req.addressee?.avatar_url || brandConfig.sampleImages.defaultAvatar}
                      alt={req.addressee?.full_name || 'Member'}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                    />
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-white">
                        {req.addressee?.full_name}
                      </h4>
                      <p className="font-mono text-[11px] text-editorial-subtle">
                        @{req.addressee?.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 bg-obsidian-950 border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      <span>Awaiting Acceptance</span>
                    </span>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Cancel Invitation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={!!connectionToDisconnect}
        title="Sever Sovereign Connection"
        message={`Are you sure you wish to disconnect from ${connectionToDisconnect?.peer.full_name}? Your mutual zero-knowledge channel pairings will be deactivated.`}
        confirmLabel="Disconnect"
        isDestructive={true}
        onConfirm={handleDisconnect}
        onCancel={() => setConnectionToDisconnect(null)}
      />
    </div>
  );
};
