import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Initialize auth ONCE on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await apiClient.get('/users/me');
        setUser(data);
      } catch (err) {
        console.error('Auth init failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 🚪 DEV LOGIN (ID-based)
  const login = async (userId) => {
    try {
      // 1️⃣ Dev login (NO apiClient here)
      const { data } = await axios.post(`/dev/auth/login/${userId}`);

      // 2️⃣ Store token immediately
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);

      // 🔥 3️⃣ FIRST authenticated call: pass token explicitly
      const userRes = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      setUser(userRes.data);
    } catch (err) {
      console.error('Login failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      // 🔥 Call backend to mark user OFFLINE before clearing token
      await apiClient.post('/dev/auth/logout');
    } catch (err) {
      console.error('Logout API failed:', err);
      // Continue with local logout even if API fails
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
