import { useState, useCallback } from 'react';
import { useDialog } from '../context/DialogContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '@/components/ui/card';
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
    const dialog = useDialog();
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
            setPendingActions(prev => ({ ...prev, [`send-${userId}`]: false }));
            await dialog.alert('Error', err.response?.data?.message || 'Failed to send friend request');
        }
    }, [removeRecentlyMetLocally]);

    /**
     * Accept an incoming friend request
     */
    const handleAcceptRequest = useCallback(async (requesterId) => {
        setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: true }));

        try {
            await friendsApi.acceptFriendRequest(requesterId);
            removeRequestLocally(requesterId);
            // RealTimeContext will handle adding the friend via WebSocket event
            // But refresh to ensure consistency
            refreshFriends();
        } catch (err) {
            console.error('Failed to accept friend request:', err);
            setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: false }));
            await dialog.alert('Error', err.response?.data?.message || 'Failed to accept friend request');
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
            setPendingActions(prev => ({ ...prev, [`reject-${requesterId}`]: false }));
            await dialog.alert('Error', err.response?.data?.message || 'Failed to reject friend request');
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

    return (
        <PageContainer>
            <div className="space-y-6 sm:space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Friends</h1>
                        <p className="text-lg text-gray-500 dark:text-slate-400 mt-2 transition-colors font-medium">Manage your connections and requests</p>
                    </div>
                </div>

                {/* Recently Met Section */}
                <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Recently Met</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">People you've connected with in exchange sessions</p>
                    </div>
                    <RecentlyMetList
                        users={recentlyMet}
                        onSendRequest={handleSendRequest}
                        pendingActions={pendingActions}
                    />
                </div>

                {/* Friend Requests Section */}
                <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Friend Requests</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pending requests from other users</p>
                    </div>
                    <FriendRequestsList
                        requests={requests}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        pendingActions={pendingActions}
                    />
                </div>

                {/* Friends List Section */}
                <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Your Friends</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">People you've connected with</p>
                    </div>
                    <FriendsList friends={friends} />
                </div>
            </div>
        </PageContainer>
    );
};

export default FriendsPage;
