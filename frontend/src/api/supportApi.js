import apiClient from './client';

export const supportApi = {
    // User endpoints
    sendSupport: (subject, message) => apiClient.post('/support', { subject, message }),
    sendReport: (subject, message, relatedEntityType, relatedEntityId) =>
        apiClient.post('/report', { subject, message, relatedEntityType, relatedEntityId }),

    // Admin endpoints (using apiClient which handles base URL and auth)
    getMessages: (page = 0, size = 20) => apiClient.get('/admin/messages', { params: { page, size } }),
    resolveMessage: (id) => apiClient.put(`/admin/messages/${id}/resolve`),
};
