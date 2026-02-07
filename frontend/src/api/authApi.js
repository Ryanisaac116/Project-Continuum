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
    devLogin: (userId) => apiClient.post('/auth/dev/login', { userId }),

    /**
     * Logout current user.
     */
    logout: () => apiClient.post('/users/logout'),

    /**
     * Soft deactivate current user account.
     */
    deactivateAccount: () => apiClient.patch('/users/me/deactivate'),

    /**
     * Permanently delete current user account.
     */
    deleteAccount: () => apiClient.delete('/users/me'),

    /**
     * Get current authenticated user
     */
    getMe: () => apiClient.get('/users/me', { skipAuthRedirect: true }),
};

export default authApi;
