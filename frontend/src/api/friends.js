import apiClient from './client';

/**
 * Friends API
 * 
 * Maps to backend FriendController:
 * - GET  /api/friends             → Accepted friends
 * - GET  /api/friends/requests    → Pending incoming requests
 * - GET  /api/friends/recently-met → Users from completed sessions
 * - POST /api/friends/{id}/request → Send friend request
 * - POST /api/friends/{id}/accept  → Accept friend request
 * - POST /api/friends/{id}/reject  → Reject friend request
 */
export const friendsApi = {
    // ==================== READ ====================

    /**
     * Get accepted friends list
     * Returns: Array<{ userId, name, presence }>
     */
    getFriends: () => apiClient.get('/friends'),

    /**
     * Get pending incoming friend requests
     * Returns: Array<{ requesterId, requesterName, presence, requestedAt }>
     */
    getPendingRequests: () => apiClient.get('/friends/requests'),

    /**
     * Get recently met users from completed sessions
     * Excludes users with existing friend relationship
     * Returns: Array<{ userId, name, presence, lastSessionAt }>
     */
    getRecentlyMet: () => apiClient.get('/friends/recently-met'),

    // ==================== WRITE ====================

    /**
     * Send friend request to a user (from Recently Met)
     * @param {number} userId - Target user ID
     */
    sendFriendRequest: (userId) => apiClient.post(`/friends/${userId}/request`),

    /**
     * Accept an incoming friend request
     * @param {number} requesterId - User who sent the request
     */
    acceptFriendRequest: (requesterId) => apiClient.post(`/friends/${requesterId}/accept`),

    /**
     * Reject an incoming friend request
     * @param {number} requesterId - User who sent the request
     */
    rejectFriendRequest: (requesterId) => apiClient.post(`/friends/${requesterId}/reject`),
};

export default friendsApi;
