import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[API] Request to:', config.url, 'Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Log response errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response OK:', response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      // Let AuthContext + ProtectedRoute handle navigation
    }
    return Promise.reject(error);
  }
);

export default apiClient;
