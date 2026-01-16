import { useState, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import FriendsList from '../components/friends/FriendsList';
import FriendRequestsList from '../components/friends/FriendRequestsList';
import RecentlyMetList from '../components/friends/RecentlyMetList';
import friendsApi from '../api/friends';
import { useRealTime } from '../context/RealTimeContext';

/**
 * FriendsPage - Uses RealTimeContext for centralized state
 * 
 * Sections:
 * 1. Recently Met - Users from completed sessions (can send request)
 * 2. Friend Requests - Pending incoming requests (can accept/reject)
 * 3. Friends - Accepted friends list with real-time presence
 */
const FriendsPage = () => {
    const {
        friends,
        pendingRequests: requests,
        recentlyMet,
        isLoading,
        removeRequestLocally,
        removeRecentlyMetLocally,
        refreshFriends
    } = useRealTime();

    // UI state for pending API actions
    const [pendingActions, setPendingActions] = useState({});
    const [error, setError] = useState(null);

    // ==================== ACTION HANDLERS ====================

    /**
     * Send friend request to a recently met user
     */
    const handleSendRequest = useCallback(async (userId) => {
        setPendingActions(prev => ({ ...prev, [`send-${userId}`]: true }));

        try {
            await friendsApi.sendFriendRequest(userId);
            removeRecentlyMetLocally(userId);
        } catch (err) {
            console.error('Failed to send friend request:', err);
            alert(err.response?.data?.message || 'Failed to send friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`send-${userId}`]: false }));
        }
    }, [removeRecentlyMetLocally]);

    /**
     * Accept an incoming friend request
     */
    const handleAcceptRequest = useCallback(async (requesterId, requesterName, presence) => {
        setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: true }));

        try {
            await friendsApi.acceptFriendRequest(requesterId);
            removeRequestLocally(requesterId);
            // RealTimeContext will handle adding the friend via WebSocket event
            // But refresh to ensure consistency
            refreshFriends();
        } catch (err) {
            console.error('Failed to accept friend request:', err);
            alert(err.response?.data?.message || 'Failed to accept friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: false }));
        }
    }, [removeRequestLocally, refreshFriends]);

    /**
     * Reject an incoming friend request
     */
    const handleRejectRequest = useCallback(async (requesterId) => {
        setPendingActions(prev => ({ ...prev, [`reject-${requesterId}`]: true }));

        try {
            await friendsApi.rejectFriendRequest(requesterId);
            removeRequestLocally(requesterId);
        } catch (err) {
            console.error('Failed to reject friend request:', err);
            alert(err.response?.data?.message || 'Failed to reject friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`reject-${requesterId}`]: false }));
        }
    }, [removeRequestLocally]);

    // ==================== RENDER ====================

    if (isLoading) {
        return (
            <PageContainer>
                <div className="text-center py-20">
                    <div className="text-gray-500 dark:text-slate-500">Loading friends...</div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer>
                <div className="text-center py-20">
                    <div className="text-red-500 dark:text-red-400">{error}</div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="space-y-4 sm:space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Friends</h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-1 transition-colors">Manage your connections and requests</p>
                    </div>
                </div>

                {/* Recently Met Section */}
                <Card>
                    <CardHeader
                        title="Recently Met"
                        description="People you've connected with in exchange sessions"
                    />
                    <RecentlyMetList
                        users={recentlyMet}
                        onSendRequest={handleSendRequest}
                        pendingActions={pendingActions}
                    />
                </Card>

                {/* Friend Requests Section */}
                <Card>
                    <CardHeader
                        title="Friend Requests"
                        description="Pending requests from other users"
                    />
                    <FriendRequestsList
                        requests={requests}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        pendingActions={pendingActions}
                    />
                </Card>

                {/* Friends List Section */}
                <Card>
                    <CardHeader
                        title="Your Friends"
                        description="People you've connected with"
                    />
                    <FriendsList friends={friends} />
                </Card>
            </div>
        </PageContainer>
    );
};

export default FriendsPage;
