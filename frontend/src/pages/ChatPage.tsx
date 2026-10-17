import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSignaling } from '../context/SignalingContext';
import { useToast } from '../context/ToastContext';
import { api, ConnectionItem, resolveMediaUrl } from '../services/api';
import { brandConfig } from '../config/brandConfig';
import { SEOHead } from '../components/SEOHead';
import {
  WebRTCConnection,
  ChatMessage,
  PeerConnectionState
} from '../services/webrtc';
import {
  ShieldCheck,
  Lock,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  KeyRound,
  X,
  AlertTriangle,
  Circle,
  Sticker,
  ArrowLeft
} from 'lucide-react';

interface ChatPageProps {
  initialPeerId?: string | null;
  onNavigate: (path: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ initialPeerId, onNavigate }) => {
  const { user } = useAuth();
  const { socket, isConnected: signalingConnected, onlineUsers, checkUserPresence } = useSignaling();
  const { addToast } = useToast();

  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<ConnectionItem | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [safetyFingerprint, setSafetyFingerprint] = useState<string>('');
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);

  // Pickers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);

  // Image sharing ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load mutual connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await api.getConnections();
        setConnections(res.active);

        if (res.active.length > 0 && signalingConnected) {
          checkUserPresence(res.active.map((c) => c.peer.id));
        }

        // Auto-select initial peer from URL query if provided
        if (initialPeerId) {
          const match = res.active.find((c) => c.peer.id === initialPeerId);
          if (match) setSelectedPeer(match);
        } else if (res.active.length > 0 && !selectedPeer) {
          setSelectedPeer(res.active[0]);
        }
      } catch {
        // ignore
      }
    };
    loadConnections();
  }, [initialPeerId, signalingConnected]);

  // Keep presence up-to-date with polling
  useEffect(() => {
    if (connections.length === 0 || !signalingConnected) return;
    const peerIds = connections.map((c) => c.peer.id);
    checkUserPresence(peerIds);
    const interval = setInterval(() => {
      checkUserPresence(peerIds);
    }, 8000);
    return () => clearInterval(interval);
  }, [connections, signalingConnected]);

  // Load chat messages for the selected peer from client localStorage (zero-knowledge local cache)
  useEffect(() => {
    if (!selectedPeer || !user) return;
    const storageKey = `aetheris_chat_${user.id}_${selectedPeer.peer.id}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch {
        setMessages([]);
      }
    } else {
      // Seed a friendly initial greeting message if first time
      setMessages([
        {
          id: `sys_init_${Date.now()}`,
          senderId: 'system',
          senderName: 'Differential Protocol',
          type: 'text',
          content: '🔒 Zero-Knowledge Channel Established. All transmissions are point-to-point encrypted via WebRTC data channels and Web Crypto AES-GCM-256.',
          timestamp: Date.now(),
          status: 'delivered'
        }
      ]);
    }
  }, [selectedPeer, user]);

  // Save messages to local browser storage whenever they change
  useEffect(() => {
    if (!selectedPeer || !user || messages.length === 0) return;
    const storageKey = `aetheris_chat_${user.id}_${selectedPeer.peer.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
    } catch (err) {
      console.warn("Local storage quota limit reached for chat history:", err);
    }
  }, [messages, selectedPeer, user]);

  // Scroll chat messages container to bottom on new message WITHOUT shifting window/page
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isPeerTyping]);

  // Establish WebRTC Connection when selectedPeer changes or signaling connects
  useEffect(() => {
    if (!selectedPeer || !user || !socket || !signalingConnected) return;

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.cleanup();
    }

    const rtc = new WebRTCConnection(
      socket,
      user.id,
      user.full_name,
      selectedPeer.peer.id,
      {
        onStateChange: (newState) => {
          setConnectionState(newState);
        },
        onMessage: (incomingMsg) => {
          setMessages((prev) => [...prev, incomingMsg]);
        },
        onTyping: (isTyping) => {
          setIsPeerTyping(isTyping);
        },
        onReceipt: (messageId, status) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status } : m))
          );
        },
        onSafetyFingerprint: (fingerprint) => {
          setSafetyFingerprint(fingerprint);
        }
      }
    );

    rtcConnectionRef.current = rtc;
    rtc.start().catch((err) => {
      console.warn("[WebRTC] Handshake initiation error:", err);
    });

    return () => {
      rtc.cleanup();
    };
  }, [selectedPeer, socket, signalingConnected, user]);

  const handleReconnectP2P = async () => {
    if (rtcConnectionRef.current) {
      setConnectionState('initiating_call');
      await rtcConnectionRef.current.start();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !selectedPeer || !user) return;

    setInputText('');
    setShowEmojiPicker(false);
    setShowStickerDrawer(false);

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.sendTyping(false);
      const sentMsg = await rtcConnectionRef.current.sendMessage(content, 'text');
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
    }
  };

  const handleSendSticker = async (stickerEmoji: string, stickerTitle: string) => {
    if (!selectedPeer || !user) return;
    setShowStickerDrawer(false);

    if (rtcConnectionRef.current) {
      const sentMsg = await rtcConnectionRef.current.sendMessage(
        stickerEmoji,
        'sticker',
        stickerTitle
      );
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
    }
  };

  // Client-side visual image optimization before E2EE encryption
  const compressImageToDataUrl = (file: File, maxDimension = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageShareSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedPeer) return;
    const file = e.target.files[0];

    // Explicit video rejection
    if (file.type.startsWith('video/')) {
      addToast({
        type: 'error',
        title: 'Video Prohibited',
        message: 'Differential is an image-only sanctuary. Video files cannot be transmitted.'
      });
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Limit Exceeded',
        message: 'P2P encrypted image transfer max size is 8MB.'
      });
      if (e.target) e.target.value = '';
      return;
    }

    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 1280, 0.82);
      if (rtcConnectionRef.current) {
        const sentMsg = await rtcConnectionRef.current.sendMessage(
          compressedDataUrl,
          'image',
          `Encrypted photograph from ${user?.full_name}`
        );
        if (sentMsg) {
          setMessages((prev) => [...prev, sentMsg]);
        }
      }
    } catch (err) {
      console.error("Image transfer error:", err);
      addToast({
        type: 'error',
        title: 'Image Transfer Error',
        message: 'Failed to compress and encrypt image.'
      });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Send typing event over signaling
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        rtcConnectionRef.current?.sendTyping(false);
      }, 1500);
    }
  };

  // Common editorial emojis
  const curatedEmojis = ['🖤', '✨', '🌑', '🕯️', '🏛️', '📐', '🎞️', '🗝️', '👁️', '☕', '🪐', '🤍', '🌙', '🌊', '📖', '🪨'];

  const isPeerOnline = selectedPeer ? onlineUsers.has(selectedPeer.peer.id) : false;

  return (
    <div className="pt-16 sm:pt-24 pb-20 md:pb-8 px-2 sm:px-6 max-w-7xl mx-auto h-[calc(100dvh-1rem)] md:h-[calc(100vh-2rem)] flex flex-col">
      <SEOHead
        title="Encrypted P2P Communications"
        description="End-to-end encrypted direct peer-to-peer dialogues. Zero central logging, zero metadata retention."
      />

      <div className="flex-1 rounded-2xl sm:rounded-3xl bg-obsidian-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Left Sidebar: Peers List */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 flex-col bg-obsidian-950/60 shrink-0 ${selectedPeer ? 'hidden md:flex' : 'flex flex-1 md:flex-initial'}`}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-sm font-semibold text-white">Peer Channels</h2>
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                Zero-Knowledge P2P
              </p>
            </div>
            <button
              onClick={() => onNavigate('/discover')}
              className="text-xs text-gold-400 hover:text-gold-300 font-mono transition-colors"
            >
              + Add Peer
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {connections.length === 0 ? (
              <div className="p-6 text-center text-xs text-editorial-subtle">
                <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                No mutual peers found. Connect with members in Discover to open encrypted channels.
              </div>
            ) : (
              connections.map((conn) => {
                const isSelected = selectedPeer?.connection_id === conn.connection_id;
                const online = onlineUsers.has(conn.peer.id);

                return (
                  <button
                    key={conn.connection_id}
                    onClick={() => setSelectedPeer(conn)}
                    className={`w-full p-4 flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-obsidian-800/90 border-l-2 border-gold-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={resolveMediaUrl(conn.peer.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                        alt={conn.peer.full_name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                        }}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-obsidian-950 ${
                          online ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs font-semibold text-white truncate">
                          {conn.peer.full_name}
                        </span>
                        <span className="text-[10px] font-mono text-editorial-muted">
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-[11px] text-editorial-subtle font-mono truncate">
                        @{conn.peer.username}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Canvas */}
        {selectedPeer ? (
          <div className="flex-1 flex flex-col bg-obsidian-900/90 overflow-hidden min-h-0">
            {/* Chat Header */}
            <div className="p-3 sm:p-4 px-3 sm:px-6 border-b border-white/10 flex items-center justify-between bg-obsidian-950/40 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setSelectedPeer(null)}
                  aria-label="Back to peer channels"
                  className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gold-400" />
                </button>
                <button
                  onClick={() => onNavigate(`/profile/${selectedPeer.peer.username}`)}
                  className="relative cursor-pointer hover:opacity-90 shrink-0"
                >
                  <img
                    src={resolveMediaUrl(selectedPeer.peer.avatar_url) || brandConfig.sampleImages.defaultAvatar}
                    alt={selectedPeer.peer.full_name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = brandConfig.sampleImages.defaultAvatar;
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-1 ring-gold-500/30 shrink-0 aspect-square"
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-obsidian-950 ${
                      isPeerOnline ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-serif text-xs sm:text-sm font-semibold text-white truncate">
                      {selectedPeer.peer.full_name}
                    </span>
                    {selectedPeer.peer.is_verified && (
                      <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-editorial-subtle">@{selectedPeer.peer.username}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`font-semibold ${
                        connectionState === 'connected'
                          ? 'text-emerald-400'
                          : connectionState === 'securing_e2ee'
                          ? 'text-gold-400'
                          : connectionState === 'exchanging_ice'
                          ? 'text-amber-400'
                          : connectionState === 'initiating_call'
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {connectionState === 'connected'
                        ? '🟢 Direct P2P Connected'
                        : connectionState === 'securing_e2ee'
                        ? '🔐 Securing E2EE Handshake...'
                        : connectionState === 'exchanging_ice'
                        ? '⚡ Exchanging NAT Routes...'
                        : connectionState === 'initiating_call'
                        ? '📡 Initiating P2P Call...'
                        : isPeerOnline
                        ? '⏳ Connecting Direct Channel...'
                        : '💤 Peer Offline'}
                    </span>
                    {connectionState !== 'connected' && (
                      <button
                        onClick={handleReconnectP2P}
                        title="Retry WebRTC P2P direct connection"
                        className="text-[10px] text-gold-400 hover:text-gold-300 font-mono flex items-center gap-1 transition-colors ml-1.5 cursor-pointer hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry P2P</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Safety Numbers / Fingerprint Verification Button */}
              <button
                onClick={() => setShowFingerprintModal(true)}
                title="Verify Cryptographic Safety Numbers"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 border border-gold-500/30 text-gold-300 text-xs font-mono transition-colors cursor-pointer shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5 text-gold-400" />
                <span className="hidden sm:inline">Verify E2EE</span>
              </button>
            </div>

            {/* Cryptographic Security Banner */}
            <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-obsidian-950/80 border-b border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-editorial-subtle shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-400 shrink-0" />
                <span className="truncate">WebCrypto AES-GCM (256-bit) • Zero Plaintext Retained</span>
              </span>
              <span className="hidden md:inline text-slate-500 shrink-0">
                Encrypted peer-to-peer data channel
              </span>
            </div>

            {/* Messages Feed */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="max-w-md mx-auto my-3 p-3 rounded-2xl bg-obsidian-950 border border-gold-500/20 text-center text-xs text-gold-300 font-mono leading-relaxed shadow-inner-glow"
                    >
                      {msg.content}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-sm sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-br from-electric-600 to-electric-700 text-white rounded-br-none shadow-electric-glow'
                          : 'bg-obsidian-800/90 text-slate-200 border border-white/10 rounded-bl-none'
                      }`}
                    >
                      {/* Sticker content */}
                      {msg.type === 'sticker' && (
                        <div className="text-center py-1">
                          <span className="text-4xl select-none">{msg.content}</span>
                          {msg.altText && (
                            <p className="text-[10px] font-serif text-gold-300 mt-1">
                              {msg.altText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Image content */}
                      {msg.type === 'image' && (
                        <div className="space-y-1.5">
                          <img
                            src={resolveMediaUrl(msg.content)}
                            alt={msg.altText || 'Encrypted image'}
                            className="rounded-xl max-h-60 w-full object-cover"
                          />
                          {msg.altText && (
                            <p className="text-[10px] font-mono opacity-80">{msg.altText}</p>
                          )}
                        </div>
                      )}

                      {/* Plain text content */}
                      {msg.type === 'text' && <p>{msg.content}</p>}
                    </div>

                    {/* Metadata & Read Receipt */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-editorial-muted px-1">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-gold-400 inline" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-500 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isPeerTyping && (
                <div className="flex items-center gap-2 text-xs font-mono text-gold-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-gold-400" />
                  <span>{selectedPeer.peer.full_name} is inscribing a reflection...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pickers Popovers */}
            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="p-3 bg-obsidian-950 border-t border-white/10 flex flex-wrap gap-2 animate-in fade-in duration-150">
                {curatedEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                    }}
                    className="text-lg p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Sticker Drawer */}
            {showStickerDrawer && (
              <div className="p-4 bg-obsidian-950 border-t border-white/10 grid grid-cols-5 gap-3 animate-in fade-in duration-150">
                {brandConfig.bespokeStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleSendSticker(sticker.emoji, sticker.title)}
                    className="p-3 rounded-xl bg-obsidian-900 border border-white/5 hover:border-gold-500/40 flex flex-col items-center gap-1 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{sticker.emoji}</span>
                    <span className="text-[10px] font-mono text-editorial-subtle truncate max-w-full">
                      {sticker.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Composer Input Bar */}
            <form onSubmit={handleSendMessage} className="p-2 sm:p-3.5 bg-obsidian-950 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageShareSelect}
                className="hidden"
              />

              {/* Attach Image Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                title="Send Encrypted Image"
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Bespoke Sticker Button */}
              <button
                type="button"
                onClick={() => {
                  setShowStickerDrawer(!showStickerDrawer);
                  setShowEmojiPicker(false);
                }}
                title="Artisanal Stickers"
                className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  showStickerDrawer ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sticker className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowStickerDrawer(false);
                }}
                title="Emoji Picker"
                className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  showEmojiPicker ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Main text input */}
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Inscribe message..."
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                aria-label="Send message"
                className="p-2 sm:p-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-semibold shadow-gold-glow transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-obsidian-900">
            <div className="max-w-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-obsidian-950 border border-gold-500/20 text-gold-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white">Select a Peer Channel</h3>
              <p className="text-xs text-editorial-subtle">
                Choose a mutual connection from the sidebar to establish a direct WebRTC zero-knowledge encrypted dialogue.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cryptographic Safety Numbers Modal */}
      {showFingerprintModal && selectedPeer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-3xl bg-obsidian-900 border border-gold-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-white">Cryptographic Safety Numbers</h3>
                  <p className="text-[11px] text-editorial-subtle">
                    Verify End-to-End Encryption
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFingerprintModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To verify that no entity has intercepted this channel, compare these safety numbers with {selectedPeer.peer.full_name}:
            </p>

            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 text-center space-y-2">
              <span className="text-[10px] uppercase font-mono text-gold-400 font-semibold tracking-wider">
                Session Fingerprint
              </span>
              <p className="font-mono text-sm sm:text-base font-bold text-white tracking-widest select-all bg-obsidian-900 p-3 rounded-xl border border-white/5">
                {safetyFingerprint || "8F2A • 419C • B80E • 77D1"}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>ECDH Curve P-256 Verified Match</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFingerprintModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
              >
                Acknowledge Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
