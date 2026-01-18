import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import apiClient, { getToken, clearAuthState } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Initialize auth ONCE on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get('/users/me');
        setUser(data);
      } catch (err) {
        console.error('Auth init failed:', err);
        clearAuthState();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 🔄 Update local user presence (called by useTabPresence)
  const updateUserPresence = useCallback((status) => {
    console.log('[AuthContext] updateUserPresence called with:', status);
    setUser(prev => {
      if (!prev) return null;
      console.log('[AuthContext] Updating user presence from', prev.presenceStatus, 'to', status);
      return { ...prev, presenceStatus: status };
    });
  }, []);

  // 🚪 DEV LOGIN (ID-based)
  const login = async (userId) => {
    try {
      // 1️⃣ Dev login (NO apiClient here)
      const { data } = await axios.post('/api/auth/dev/login', { userId });

      // 2️⃣ Store token immediately
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);

      // 🔥 3️⃣ FIRST authenticated call: pass token explicitly
      const userRes = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      // ⚡ Optimistic Update: User is definitely ONLINE now.
      const userData = { ...userRes.data, presenceStatus: 'ONLINE' };
      console.log('[AuthContext] Login successful. Optimistically setting ONLINE:', userData);

      setUser(userData);
    } catch (err) {
      console.error('Login failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw err;
    }
  };

  // 🌐 OAUTH LOGIN (Token based)
  const handleOAuthLogin = useCallback(async (token) => {
    try {
      // 1. Store token
      localStorage.setItem('token', token);

      // 2. Fetch User Profile using new token
      const userRes = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Set User
      const userData = { ...userRes.data, presenceStatus: 'ONLINE' };
      setUser(userData);
      localStorage.setItem('userId', userData.id);

      return userData;
    } catch (err) {
      console.error('OAuth Login processing failed:', err);
      clearAuthState();
      throw err;
    }
  }, []);

  const logout = async () => {
    try {
      if (user?.id) {
        // 🔥 Call backend to mark user OFFLINE before clearing token
        await apiClient.post(`/dev/auth/logout/${user.id}`);
      }
    } catch (err) {
      console.error('Logout API failed:', err);
      // Continue with local logout even if API fails
    }

    clearAuthState();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, handleOAuthLogin, logout, updateUserPresence }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
