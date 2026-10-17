import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiBaseUrl, getAuthToken } from '../services/api';

import { requestNotificationPermissions, sendSystemNotification } from '../services/notifications';

interface SignalingContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  checkUserPresence: (userIds: string[]) => void;
}

const SignalingContext = createContext<SignalingContextType | undefined>(undefined);

export const SignalingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Request notifications permission on login / startup
  useEffect(() => {
    if (user) {
      requestNotificationPermissions().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const apiBase = getApiBaseUrl();
    const socketUrl = apiBase || (
      window.location.port === '5173'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin
    );

    const token = getAuthToken();

    // Connect to signaling endpoint
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      auth: token ? { token } : undefined,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1500
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('presence_update', (data: { user_id: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.online) {
          next.add(data.user_id);
        } else {
          next.delete(data.user_id);
        }
        return next;
      });
    });

    socketInstance.on('presence_status', (presenceMap: Record<string, boolean>) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        Object.entries(presenceMap).forEach(([uid, isOnline]) => {
          if (isOnline) next.add(uid);
          else next.delete(uid);
        });
        return next;
      });
    });

    // In-app & System Notifications (Posts, Connections, Likes, Comments)
    socketInstance.on('notification_received', (data: any) => {
      if (data && data.message) {
        let title = 'Differential Notification';
        if (data.type === 'post_created') {
          title = `${data.actor?.full_name || 'Connection'} posted a new photo`;
        } else if (data.type === 'connection_request') {
          title = 'New Connection Request';
        } else if (data.type === 'connection_accepted') {
          title = 'Connection Request Accepted';
        } else if (data.type === 'post_like') {
          title = 'Post Interaction';
        } else if (data.type === 'post_comment') {
          title = 'New Comment';
        }

        sendSystemNotification({
          title,
          body: data.message,
          url: data.type === 'post_created' ? '/feed' : '/notifications'
        });
      }
    });

    // Encrypted Chat System Notification
    socketInstance.on('encrypted_message_received', (data: any) => {
      const senderName = data?.sender?.full_name || 'A contact';
      // If user isn't focused or is in another screen, show system notification
      sendSystemNotification({
        title: `${senderName}`,
        body: 'Sent you an encrypted message',
        url: '/chat'
      });
    });

    // Offline Messages Available Alert on Reconnect
    socketInstance.on('offline_messages_available', (data: { count: number }) => {
      if (data && data.count > 0) {
        sendSystemNotification({
          title: 'Encrypted Transmissions Received',
          body: `You received ${data.count} secure message(s) while offline.`,
          url: '/chat'
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const checkUserPresence = (userIds: string[]) => {
    if (socket && isConnected) {
      socket.emit('check_presence', { user_ids: userIds });
    }
  };

  return (
    <SignalingContext.Provider value={{ socket, isConnected, onlineUsers, checkUserPresence }}>
      {children}
    </SignalingContext.Provider>
  );
};

export const useSignaling = () => {
  const context = useContext(SignalingContext);
  if (!context) {
    throw new Error('useSignaling must be used within a SignalingProvider');
  }
  return context;
};
