import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiBaseUrl, getAuthToken } from '../services/api';

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
