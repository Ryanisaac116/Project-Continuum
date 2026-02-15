import axios from 'axios';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// Token Utilities (centralized localStorage access)
// =============================================================================

/**
 * Get the current auth token
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Get the current user ID
 * @returns {string|null}
 */
export const getUserId = () => localStorage.getItem('userId');

/**
 * Clear all auth state from localStorage
 */
export const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
};

/**
 * Get WebSocket URL with token
 * @param {string} token - Auth token
 * @returns {string} Full WebSocket URL
 */
export const getWsUrl = (token) => {
  let wsUrl;

  if (API_BASE_URL.startsWith('http')) {
    // Production / Full URL case
    const url = new URL(API_BASE_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${url.host}/ws`;
  } else {
    // Development / Relative Proxy case (e.g. "/api")
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    wsUrl = `${protocol}//${host}:${port}/ws`;
  }

  return `${wsUrl}?token=${token}`;
};

// =============================================================================
// API Client
// =============================================================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('[API] Request to:', config.url, 'Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response OK:', response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const data = error.response?.data;
      const errorCode = data?.error;
      const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect);

      console.log('[API] 401 error:', data);
      if (skipAuthRedirect) {
        return Promise.reject(error);
      }

      // Force logout only when backend explicitly invalidates the session/account.
      if (errorCode === 'session_invalidated' || errorCode === 'account_inactive') {
        clearAuthState();

        const msg = errorCode === 'session_invalidated'
          ? (data?.message || 'Your session is no longer valid. Please log in again.')
          : (data?.message || 'Your account is inactive.');

        // Dynamic import to avoid circular dependency
        import('../utils/sessionAlert.js').then(({ showSessionAlert }) => {
          showSessionAlert(msg).then(() => {
            window.location.href = '/login';
          });
        });

        // Prevent caller chains from continuing with stale state.
        return new Promise(() => { });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
