/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getToken, clearAuthState } from '../api/client';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);
const isDevAuthMode = import.meta.env.VITE_AUTH_MODE === 'dev';

const isTerminalAuthError = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.error;
  return status === 401 && (code === 'session_invalidated' || code === 'account_inactive');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthState();
    setUser(null);
  }, []);

  const persistUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('userId', String(userData.id));
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const restoreDevSession = useCallback(async () => {
    if (!isDevAuthMode) return false;

    const cachedUserIdRaw = localStorage.getItem('userId');
    const cachedUserId = Number(cachedUserIdRaw);
    if (!cachedUserIdRaw || Number.isNaN(cachedUserId)) {
      return false;
    }

    try {
      const { data } = await authApi.devLogin(cachedUserId);
      localStorage.setItem('token', data.token);

      const userRes = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      persistUser({ ...userRes.data, presenceStatus: 'ONLINE' });
      return true;
    } catch (err) {
      console.error('Dev session restore failed:', err);
      return false;
    }
  }, [persistUser]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();

      if (!token) {
        const restored = await restoreDevSession();
        if (!restored) {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      let hasCachedUser = false;
      const cachedUserRaw = localStorage.getItem('user');
      if (cachedUserRaw) {
        try {
          setUser(JSON.parse(cachedUserRaw));
          hasCachedUser = true;
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        const { data } = await authApi.getMe();
        persistUser(data);
      } catch (err) {
        console.error('Auth init failed:', err);

        if (isTerminalAuthError(err)) {
          const restored = await restoreDevSession();
          if (!restored) {
            clearSession();
          }
        } else if (!hasCachedUser) {
          // Keep token for retryable failures, but avoid showing protected UI with no user.
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearSession, persistUser, restoreDevSession]);

  // Keep auth state in sync across tabs/windows without needing refresh.
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key && !['token', 'user', 'userId'].includes(event.key)) return;

      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const cachedUserRaw = localStorage.getItem('user');
      if (!cachedUserRaw) return;

      try {
        setUser(JSON.parse(cachedUserRaw));
      } catch {
        localStorage.removeItem('user');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateUserPresence = useCallback((status) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, presenceStatus: status };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const login = async (userId) => {
    try {
      const { data } = await authApi.devLogin(Number(userId));

      localStorage.setItem('token', data.token);

      const userRes = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      const userData = { ...userRes.data, presenceStatus: 'ONLINE' };
      persistUser(userData);
    } catch (err) {
      console.error('Login failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw err;
    }
  };

  const handleOAuthLogin = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);

      const userRes = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = { ...userRes.data, presenceStatus: 'ONLINE' };
      persistUser(userData);

      return userData;
    } catch (err) {
      console.error('OAuth Login processing failed:', err);
      clearSession();
      throw err;
    }
  }, [clearSession, persistUser]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      // Always clear local state on explicit user logout click.
      clearSession();
    }
  };

  const deactivateAccount = async () => {
    try {
      await authApi.deactivateAccount();
      clearSession();
    } catch (err) {
      console.error('Deactivate account failed:', err);
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      clearSession();
    } catch (err) {
      console.error('Delete account failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        handleOAuthLogin,
        logout,
        deactivateAccount,
        deleteAccount,
        updateUserPresence,
      }}
    >
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
