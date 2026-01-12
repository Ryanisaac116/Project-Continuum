import { useState, useEffect, useRef } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import FriendsList from '../components/friends/FriendsList';
import FriendRequestsList from '../components/friends/FriendRequestsList';
import RecentlyMetList from '../components/friends/RecentlyMetList';
import friendsApi from '../api/friends';
import { useAuth } from '../auth/AuthContext';
import {
    connectChatSocket,
    subscribeToPresence,
    isChatConnected
} from '../ws/chatSocket';

/**
 * FriendsPage - Main page for Friends tab
 * 
 * Phase 3: With actions enabled
 * 
 * Sections:
 * 1. Recently Met - Users from completed sessions (can send request)
 * 2. Friend Requests - Pending incoming requests (can accept/reject)
 * 3. Friends - Accepted friends list
 */
const FriendsPage = () => {
    const { user } = useAuth();

    // Data state
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [recentlyMet, setRecentlyMet] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingActions, setPendingActions] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [friendsRes, requestsRes, recentlyMetRes] = await Promise.all([
                    friendsApi.getFriends(),
                    friendsApi.getPendingRequests(),
                    friendsApi.getRecentlyMet(),
                ]);

                setFriends(friendsRes.data);
                setRequests(requestsRes.data);
                setRecentlyMet(recentlyMetRes.data);
            } catch (err) {
                console.error('Failed to fetch friends data:', err);
                setError('Failed to load friends data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ==================== PRESENCE SUBSCRIPTIONS ====================
    const presenceUnsubscribesRef = useRef([]);

    // Connect WebSocket and subscribe to friend presence updates
    useEffect(() => {
        if (friends.length === 0) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // Connect WebSocket if not connected
        const setupPresenceSubscriptions = () => {
            // Unsubscribe from previous subscriptions
            presenceUnsubscribesRef.current.forEach(unsub => unsub());
            presenceUnsubscribesRef.current = [];

            // Subscribe to each friend's presence
            friends.forEach(friend => {
                const unsub = subscribeToPresence(friend.friendUserId, (presenceUpdate) => {
                    // Update friend's presence in state
                    setFriends(prev => prev.map(f =>
                        f.friendUserId === presenceUpdate.userId
                            ? { ...f, presenceStatus: presenceUpdate.status }
                            : f
                    ));
                });
                presenceUnsubscribesRef.current.push(unsub);
            });
        };

        if (!isChatConnected()) {
            connectChatSocket(
                token,
                () => { }, // message handler not needed here
                () => setupPresenceSubscriptions(), // on connected
                (err) => console.error('Presence socket error:', err)
            );
        } else {
            setupPresenceSubscriptions();
        }

        // Cleanup on unmount or friends change
        return () => {
            presenceUnsubscribesRef.current.forEach(unsub => unsub());
            presenceUnsubscribesRef.current = [];
        };
    }, [friends.length]); // Re-subscribe when friends list changes

    // ==================== ACTION HANDLERS ====================

    /**
     * Send friend request to a recently met user
     * After success: remove from RecentlyMet list
     */
    const handleSendRequest = async (userId) => {
        setPendingActions(prev => ({ ...prev, [`send-${userId}`]: true }));

        try {
            await friendsApi.sendFriendRequest(userId);
            // Remove from recently met list (request is now pending)
            setRecentlyMet(prev => prev.filter(u => u.userId !== userId));
        } catch (err) {
            console.error('Failed to send friend request:', err);
            alert(err.response?.data?.message || 'Failed to send friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`send-${userId}`]: false }));
        }
    };

    /**
     * Accept an incoming friend request
     * After success: remove from Requests, add to Friends
     */
    const handleAcceptRequest = async (requesterId, requesterName, presence) => {
        setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: true }));

        try {
            await friendsApi.acceptFriendRequest(requesterId);
            // Remove from requests
            setRequests(prev => prev.filter(r => r.requesterId !== requesterId));
            // Add to friends list (use backend FriendResponse property names)
            setFriends(prev => [...prev, { friendUserId: requesterId, name: requesterName, presenceStatus: presence }]);
        } catch (err) {
            console.error('Failed to accept friend request:', err);
            alert(err.response?.data?.message || 'Failed to accept friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`accept-${requesterId}`]: false }));
        }
    };

    /**
     * Reject an incoming friend request
     * After success: remove from Requests
     */
    const handleRejectRequest = async (requesterId) => {
        setPendingActions(prev => ({ ...prev, [`reject-${requesterId}`]: true }));

        try {
            await friendsApi.rejectFriendRequest(requesterId);
            // Remove from requests
            setRequests(prev => prev.filter(r => r.requesterId !== requesterId));
        } catch (err) {
            console.error('Failed to reject friend request:', err);
            alert(err.response?.data?.message || 'Failed to reject friend request');
        } finally {
            setPendingActions(prev => ({ ...prev, [`reject-${requesterId}`]: false }));
        }
    };

    // ==================== RENDER ====================

    if (loading) {
        return (
            <PageContainer>
                <div className="text-center py-20">
                    <div className="text-gray-500">Loading friends...</div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer>
                <div className="text-center py-20">
                    <div className="text-red-500">{error}</div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="space-y-4 sm:space-y-8">
                {/* Page Header */}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Friends</h1>

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
