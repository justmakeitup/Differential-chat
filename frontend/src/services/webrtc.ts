/**
 * DIFFERENTIAL WEBRTC P2P E2EE ENGINE
 * 
 * Manages direct browser-to-browser WebRTC DataChannels with zero server intermediary.
 * Encrypts every frame end-to-end using WebCrypto AES-GCM derived via ECDH.
 * 
 * Features:
 * - Deterministic initiator role to eliminate negotiation glare
 * - Robust STUN + TURN relay candidate discovery for NAT traversal across cellular/tunnels
 * - ICE candidate queueing before remote description resolution
 * - Event listener cleanup to prevent memory leaks and duplicate handlers
 */

import { Socket } from 'socket.io-client';
import {
  getOrCreateIdentityKeyPair,
  deriveSessionKey,
  encryptPayload,
  decryptPayload,
  EncryptedPayload
} from './crypto';

export type PeerConnectionState = 
  | 'idle'
  | 'connecting_signaling'
  | 'initiating_call'
  | 'exchanging_ice'
  | 'securing_e2ee'
  | 'connected'
  | 'failed'
  | 'peer_offline';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'sticker' | 'image';
  content: string; // text, sticker id, or encrypted image dataUrl
  altText?: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface WebRTCEvents {
  onStateChange: (state: PeerConnectionState) => void;
  onMessage: (message: ChatMessage) => void;
  onTyping: (isTyping: boolean) => void;
  onReceipt: (messageId: string, status: 'delivered' | 'read') => void;
  onSafetyFingerprint: (fingerprint: string) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

export class WebRTCConnection {
  private socket: Socket;
  private currentUserId: string;
  private currentUserName: string;
  private targetUserId: string;
  private events: WebRTCEvents;

  public readonly isInitiator: boolean;

  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sharedAesKey: CryptoKey | null = null;
  private state: PeerConnectionState = 'idle';

  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private incomingChunks: Map<string, { received: number; total: number; chunks: string[] }> = new Map();
  private isDestroyed: boolean = false;

  // Bound event listener references for clean teardown
  private boundOfferHandler: (data: any) => void;
  private boundAnswerHandler: (data: any) => void;
  private boundIceHandler: (data: any) => void;
  private boundTypingHandler: (data: any) => void;
  private boundPeerReadyHandler: (data: any) => void;

  constructor(
    socket: Socket,
    currentUserId: string,
    currentUserName: string,
    targetUserId: string,
    events: WebRTCEvents
  ) {
    this.socket = socket;
    this.currentUserId = currentUserId;
    this.currentUserName = currentUserName;
    this.targetUserId = targetUserId;
    this.events = events;

    // Deterministic role: peer with lexicographically smaller ID is the initiator
    this.isInitiator = this.currentUserId < this.targetUserId;

    // Define bound listeners
    this.boundOfferHandler = async (data: any) => {
      if (this.isDestroyed) return;
      if (data.from_user_id === this.targetUserId) {
        await this.handleIncomingOffer(data.offer, data.key_fingerprint);
      }
    };

    this.boundAnswerHandler = async (data: any) => {
      if (this.isDestroyed) return;
      if (data.from_user_id === this.targetUserId) {
        await this.handleIncomingAnswer(data.answer, data.key_fingerprint);
      }
    };

    this.boundIceHandler = async (data: any) => {
      if (this.isDestroyed) return;
      if (data.from_user_id === this.targetUserId) {
        if (!this.peerConnection || !this.peerConnection.remoteDescription) {
          this.iceCandidateQueue.push(data.candidate);
        } else {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn("Failed to add ICE candidate", e);
          }
        }
      }
    };

    this.boundTypingHandler = (data: any) => {
      if (this.isDestroyed) return;
      if (data.from_user_id === this.targetUserId) {
        this.events.onTyping(data.is_typing);
      }
    };

    this.boundPeerReadyHandler = async (data: any) => {
      if (this.isDestroyed) return;
      if (data.from_user_id === this.targetUserId) {
        // When the remote peer announces they are ready on the chat page:
        // If we are initiator and not connected yet, initiate/re-negotiate
        if (this.isInitiator && this.state !== 'connected') {
          console.log('[WebRTC] Remote peer reported ready. Initiating offer...');
          await this.initiateConnection();
        }
      }
    };

    this.setupSignalingListeners();
  }

  private setState(newState: PeerConnectionState) {
    if (this.isDestroyed) return;
    this.state = newState;
    this.events.onStateChange(newState);
  }

  public getState(): PeerConnectionState {
    return this.state;
  }

  private setupSignalingListeners() {
    this.socket.on('signal_offer_received', this.boundOfferHandler);
    this.socket.on('signal_answer_received', this.boundAnswerHandler);
    this.socket.on('signal_ice_candidate_received', this.boundIceHandler);
    this.socket.on('signal_typing_received', this.boundTypingHandler);
    this.socket.on('signal_peer_ready_received', this.boundPeerReadyHandler);
  }

  /**
   * Announce presence in chat room and begin connection sequence
   */
  public async start() {
    this.isDestroyed = false;
    // Tell the remote peer we are active in this chat room
    this.socket.emit('signal_peer_ready', { target_user_id: this.targetUserId });

    if (this.isInitiator) {
      await this.initiateConnection();
    } else {
      this.setState('connecting_signaling');
    }
  }

  private async drainIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Failed to drain queued ICE candidate", e);
        }
      }
    }
  }

  /**
   * Connect as the initiator (Caller)
   */
  public async initiateConnection() {
    this.setState('initiating_call');
    this.closePeerConnection();

    try {
      const { keyPair, data: localKeyData } = await getOrCreateIdentityKeyPair();
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // ICE Candidate handler
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && !this.isDestroyed) {
          this.socket.emit('signal_ice_candidate', {
            target_user_id: this.targetUserId,
            candidate: event.candidate.toJSON()
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const pcState = this.peerConnection?.connectionState;
        if (pcState === 'connected') {
          this.setState('connected');
        } else if (pcState === 'disconnected' || pcState === 'failed') {
          this.setState('failed');
        }
      };

      // Create Data Channel
      this.dataChannel = this.peerConnection.createDataChannel('aetheris-encrypted-p2p', {
        ordered: true
      });
      this.setupDataChannel(this.dataChannel);

      // Create SDP Offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer via signaling with sender's public key JWK
      this.socket.emit('signal_offer', {
        target_user_id: this.targetUserId,
        offer: offer,
        key_fingerprint: {
          publicJwk: localKeyData.publicKeyJwk,
          fingerprint: localKeyData.fingerprint
        }
      });

      this.setState('exchanging_ice');
    } catch (err) {
      console.error("[WebRTC] Error initiating call:", err);
      this.setState('failed');
    }
  }

  private async handleIncomingOffer(
    offer: RTCSessionDescriptionInit,
    peerKeyData?: { publicJwk: JsonWebKey; fingerprint: string }
  ) {
    this.setState('securing_e2ee');
    this.closePeerConnection();

    try {
      const { keyPair, data: localKeyData } = await getOrCreateIdentityKeyPair();
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && !this.isDestroyed) {
          this.socket.emit('signal_ice_candidate', {
            target_user_id: this.targetUserId,
            candidate: event.candidate.toJSON()
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const pcState = this.peerConnection?.connectionState;
        if (pcState === 'connected') {
          this.setState('connected');
        } else if (pcState === 'disconnected' || pcState === 'failed') {
          this.setState('failed');
        }
      };

      // Receiver listens for incoming DataChannel
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await this.drainIceCandidates();

      // Derive E2EE Key if peer sent their public key
      if (peerKeyData?.publicJwk && keyPair?.privateKey) {
        this.sharedAesKey = await deriveSessionKey(keyPair.privateKey, peerKeyData.publicJwk);
        const combinedFingerprint = `${localKeyData.fingerprint.slice(0, 11)} • ${peerKeyData.fingerprint.slice(0, 11)}`;
        this.events.onSafetyFingerprint(combinedFingerprint);
      }

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket.emit('signal_answer', {
        target_user_id: this.targetUserId,
        answer: answer,
        key_fingerprint: {
          publicJwk: localKeyData.publicKeyJwk,
          fingerprint: localKeyData.fingerprint
        }
      });

      this.setState('exchanging_ice');
    } catch (err) {
      console.error("[WebRTC] Error handling incoming offer:", err);
      this.setState('failed');
    }
  }

  private async handleIncomingAnswer(
    answer: RTCSessionDescriptionInit,
    peerKeyData?: { publicJwk: JsonWebKey; fingerprint: string }
  ) {
    if (!this.peerConnection || this.isDestroyed) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainIceCandidates();

      if (peerKeyData?.publicJwk) {
        const { keyPair, data: localKeyData } = await getOrCreateIdentityKeyPair();
        if (keyPair?.privateKey) {
          this.sharedAesKey = await deriveSessionKey(keyPair.privateKey, peerKeyData.publicJwk);
          const combinedFingerprint = `${localKeyData.fingerprint.slice(0, 11)} • ${peerKeyData.fingerprint.slice(0, 11)}`;
          this.events.onSafetyFingerprint(combinedFingerprint);
        }
      }
    } catch (err) {
      console.error("[WebRTC] Error setting remote answer:", err);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.setState('connected');
    };

    channel.onclose = () => {
      if (this.state === 'connected') {
        this.setState('peer_offline');
      }
    };

    channel.onerror = (err) => {
      console.warn("[WebRTC] DataChannel error:", err);
      this.setState('failed');
    };

    channel.onmessage = async (event) => {
      try {
        let serializedPayload: string | null = null;
        let packet: any;

        try {
          packet = JSON.parse(event.data);
        } catch {
          return;
        }

        if (packet.t === 's') {
          // Single packet
          serializedPayload = packet.p;
        } else if (packet.t === 'c') {
          // Chunk of a large payload (e.g. image)
          const { id, i, n, d } = packet;
          let entry = this.incomingChunks.get(id);
          if (!entry) {
            entry = { received: 0, total: n, chunks: new Array(n) };
            this.incomingChunks.set(id, entry);
          }
          if (!entry.chunks[i]) {
            entry.chunks[i] = d;
            entry.received++;
          }
          if (entry.received === entry.total) {
            serializedPayload = entry.chunks.join('');
            this.incomingChunks.delete(id);
          }
        } else if (packet.ciphertext || packet.packetType) {
          // Backward compatibility for raw packets
          serializedPayload = event.data;
        }

        if (serializedPayload && this.sharedAesKey) {
          const rawPayload: EncryptedPayload = JSON.parse(serializedPayload);
          const decryptedData = await decryptPayload(rawPayload, this.sharedAesKey);
          this.handleDecryptedPacket(decryptedData);
        }
      } catch (err) {
        console.warn("[WebRTC] Failed to decrypt/process incoming packet:", err);
      }
    };
  }

  private handleDecryptedPacket(packet: any) {
    if (packet.packetType === 'chat_message') {
      const msg: ChatMessage = packet.message;
      this.events.onMessage(msg);

      // Send back encrypted delivery receipt
      this.sendControlPacket({
        packetType: 'receipt',
        messageId: msg.id,
        status: 'delivered'
      });
    } else if (packet.packetType === 'receipt') {
      this.events.onReceipt(packet.messageId, packet.status);
    }
  }

  private async transmitPayload(payload: any): Promise<boolean> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }

    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const CHUNK_SIZE = 16384; // 16 KB safe chunk size for standard WebRTC SCTP buffers

    if (serialized.length <= CHUNK_SIZE) {
      // Small payload: send directly wrapped in single packet container
      const packet = JSON.stringify({ t: 's', p: serialized });
      this.dataChannel.send(packet);
      return true;
    }

    // Large payload (e.g. high-res photograph): slice into numbered chunks
    const totalChunks = Math.ceil(serialized.length / CHUNK_SIZE);
    const transferId = `tf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    for (let i = 0; i < totalChunks; i++) {
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        return false;
      }

      const chunkData = serialized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkPacket = JSON.stringify({
        t: 'c',
        id: transferId,
        i,
        n: totalChunks,
        d: chunkData
      });

      // Flow control: pause if SCTP send buffer is high to prevent dropping
      if (this.dataChannel.bufferedAmount > 64 * 1024) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      this.dataChannel.send(chunkPacket);
    }

    return true;
  }

  public async sendMessage(content: string, type: 'text' | 'sticker' | 'image' = 'text', altText?: string): Promise<ChatMessage | null> {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      type,
      content,
      altText,
      timestamp: Date.now(),
      status: 'sending'
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open' && this.sharedAesKey) {
      try {
        const encrypted = await encryptPayload({
          packetType: 'chat_message',
          message
        }, this.sharedAesKey);

        const success = await this.transmitPayload(encrypted);
        if (success) {
          message.status = 'sent';
          return message;
        }
      } catch (err) {
        console.error("[WebRTC] Failed to encrypt/send message:", err);
      }
    }

    return message;
  }

  public async sendReadReceipt(messageId: string) {
    await this.sendControlPacket({
      packetType: 'receipt',
      messageId,
      status: 'read'
    });
  }

  public sendTyping(isTyping: boolean) {
    if (this.isDestroyed) return;
    this.socket.emit('signal_typing', {
      target_user_id: this.targetUserId,
      is_typing: isTyping
    });
  }

  private async sendControlPacket(data: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open' && this.sharedAesKey) {
      try {
        const encrypted = await encryptPayload(data, this.sharedAesKey);
        await this.transmitPayload(encrypted);
      } catch {
        // control packet failed
      }
    }
  }

  private closePeerConnection() {
    this.incomingChunks.clear();
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch {}
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch {}
      this.peerConnection = null;
    }
  }

  public cleanup() {
    this.isDestroyed = true;
    this.closePeerConnection();

    // Detach listeners to prevent memory leaks and duplicate signaling
    this.socket.off('signal_offer_received', this.boundOfferHandler);
    this.socket.off('signal_answer_received', this.boundAnswerHandler);
    this.socket.off('signal_ice_candidate_received', this.boundIceHandler);
    this.socket.off('signal_typing_received', this.boundTypingHandler);
    this.socket.off('signal_peer_ready_received', this.boundPeerReadyHandler);
  }
}
