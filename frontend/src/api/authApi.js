import apiClient from './client';

/**
 * Auth API - Authentication endpoints
 * 
 * Maps to backend dev auth endpoints (will be replaced with Google OAuth)
 */
export const authApi = {
    /**
     * Dev login by user ID
     * @param {number} userId - User ID to login as
     */
    devLogin: (userId) => apiClient.post(`/dev/auth/login/${userId}`),

    /**
     * Logout current user
     */
    logout: () => apiClient.post('/dev/auth/logout'),

    /**
     * Get current authenticated user
     */
    getMe: () => apiClient.get('/users/me'),
};

export default authApi;
