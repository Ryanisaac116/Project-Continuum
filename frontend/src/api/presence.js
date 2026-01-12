import apiClient from './client';

/**
 * Presence API - Tab-aware presence updates
 */
const presenceApi = {
    markOnline: () => apiClient.patch('/presence', { status: 'ONLINE' }),
    markOffline: () => apiClient.patch('/presence', { status: 'OFFLINE' }),
};

export default presenceApi;
