import apiClient from './client';
import axios from 'axios';

// Create a separate client for admin endpoints (no /api prefix)
const adminClient = axios.create({
    baseURL: '',  // No base URL prefix
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor to admin client
adminClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const supportApi = {
    // User endpoints (using /api prefix)
    sendSupport: (subject, message) => apiClient.post('/support', { subject, message }),
    sendReport: (subject, message, relatedEntityType, relatedEntityId) =>
        apiClient.post('/report', { subject, message, relatedEntityType, relatedEntityId }),

    // Admin endpoints (no /api prefix, direct /admin path)
    // Admin endpoints (using /api/admin prefix)
    getMessages: (page = 0, size = 20) => adminClient.get('/api/admin/messages', { params: { page, size } }),
    resolveMessage: (id) => adminClient.put(`/api/admin/messages/${id}/resolve`),
};
