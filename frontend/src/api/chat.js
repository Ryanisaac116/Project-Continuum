import apiClient from './client';

/**
 * Chat API - Message CRUD operations
 */
const chatApi = {
    // Get chat history with a friend
    getChatHistory: (friendId) => apiClient.get(`/chat/${friendId}`),

    // Edit a message (sender only)
    editMessage: (messageId, content) =>
        apiClient.patch(`/chat/messages/${messageId}`, { content }),

    // Delete a message
    // mode: 'SELF' | 'BOTH'
    deleteMessage: (messageId, mode = 'SELF') =>
        apiClient.delete(`/chat/messages/${messageId}`, { params: { mode } }),

    // Clear all messages in a chat (soft delete for me only)
    clearChat: (friendId) =>
        apiClient.delete(`/chat/clear/${friendId}`),
};

export default chatApi;

