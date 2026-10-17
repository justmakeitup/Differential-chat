import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User, getAuthToken } from '../services/api';
import { getOrCreateIdentityKeyPair } from '../services/crypto';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { identifier: string; password: string }) => Promise<void>;
  register: (data: { email: string; username: string; full_name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocally: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    // Fast-path: In native Capacitor mobile context, if no token has been stored yet, don't block app launch
    const isMobileScheme = typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname === 'localhost';
    const token = getAuthToken();
    if (isMobileScheme && !token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Synchronize client cryptographic public key with profile if logged in
  useEffect(() => {
    if (user && !user.e2ee_public_key) {
      getOrCreateIdentityKeyPair().then(({ data }) => {
        api.updateProfile({ e2ee_public_key: data.publicKeyBase64 }).then(res => {
          setUser(res.user);
        }).catch(err => console.warn("Failed to sync identity key", err));
      });
    }
  }, [user]);

  const login = async (data: { identifier: string; password: string }) => {
    const res = await api.login(data);
    setUser(res.user);
  };

  const register = async (data: { email: string; username: string; full_name: string; password: string }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const updateUserLocally = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocally
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
