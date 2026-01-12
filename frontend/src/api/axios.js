import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.29.57:8080/api',
});

// Request interceptor - add auth token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle session invalidation
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Axios error interceptor:', error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      const data = error.response?.data;
      console.log('401 error data:', data);

      // Check for session_invalidated error
      if (data?.error === 'session_invalidated') {
        console.log('Session invalidated - logging out');
        // Clear auth state
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show message to user
        alert('You were logged out because your account was used on another device.');

        // Redirect to login
        window.location.href = '/login';

        // Prevent further processing
        return new Promise(() => { });
      }
    }
    return Promise.reject(error);
  }
);

export default instance;

