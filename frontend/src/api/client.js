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
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  // Use same port as current page (Vite proxy handles /ws)
  return `${protocol}//${host}:${port}/ws?token=${token}`;
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
      console.log('[API] 401 error:', data);

      // Check for session_invalidated error (logged in elsewhere)
      if (data?.error === 'session_invalidated') {
        console.log('[API] Session invalidated - logging out');
        clearAuthState();
        alert('You were logged out because your account was used on another device.');
        window.location.href = '/login';
        // Prevent further processing
        return new Promise(() => { });
      }

      // Standard 401 - clear auth state and let ProtectedRoute handle navigation
      clearAuthState();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

