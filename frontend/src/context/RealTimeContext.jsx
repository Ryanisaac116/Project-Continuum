import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getToken } from '../api/client';
import friendsApi from '../api/friends';
import {
    connectChatSocket,
    subscribeToPresence,
    isChatConnected,
    addListener,
    onConnectionChange
} from '../ws/chatSocket';

/**
 * RealTimeContext - Centralized real-time state management
 * 
 * OPTIMIZED for instant updates without refresh:
 * - Listens to WebSocket connection state changes
 * - Auto-resubscribes on reconnect
 * - Immediate UI updates via state
 */

const RealTimeContext = createContext(null);

export const useRealTime = () => {
    const context = useContext(RealTimeContext);
    if (!context) {
        throw new Error('useRealTime must be used within RealTimeProvider');
    }
    return context;
};

export const RealTimeProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const isAuthenticated = !!user && !authLoading;

    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    // Data state
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [recentlyMet, setRecentlyMet] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    // Refs
    const presenceUnsubsRef = useRef([]);
    const listenersRef = useRef([]);
    const friendIdsRef = useRef(new Set());
    const isSettingUpRef = useRef(false);

    // Derived values
    const friendsOnline = friends.filter(f => f.presenceStatus === 'ONLINE').length;
    const friendsInSession = friends.filter(f => f.presenceStatus === 'IN_SESSION').length;

    // ==================== DATA FETCHING ====================

    const fetchAllData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const [friendsRes, requestsRes, recentlyMetRes] = await Promise.all([
                friendsApi.getFriends(),
                friendsApi.getPendingRequests(),
                friendsApi.getRecentlyMet()
            ]);

            setFriends(friendsRes.data || []);
            setPendingRequests(requestsRes.data || []);
            setRecentlyMet(recentlyMetRes.data || []);
            setHasFetched(true);
        } catch (err) {
            console.error('[RealTime] Failed to fetch data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // ==================== PRESENCE SUBSCRIPTIONS ====================

    const cleanupPresenceSubscriptions = useCallback(() => {
        presenceUnsubsRef.current.forEach(({ unsub }) => {
            try { unsub(); } catch (e) { console.warn(e); }
        });
        presenceUnsubsRef.current = [];
        friendIdsRef.current.clear();
    }, []);

    const setupPresenceSubscriptions = useCallback(() => {
        if (!isChatConnected()) return;

        const currentFriendIds = new Set(friends.map(f => f.friendUserId));
        const newFriendIds = [...currentFriendIds].filter(id => !friendIdsRef.current.has(id));

        newFriendIds.forEach(friendId => {
            const unsub = subscribeToPresence(friendId, (update) => {
                setFriends(prev => prev.map(f =>
                    f.friendUserId === update.userId
                        ? { ...f, presenceStatus: update.status, lastSeenAt: update.lastSeenAt }
                        : f
                ));
            });
            presenceUnsubsRef.current.push({ friendId, unsub });
            friendIdsRef.current.add(friendId);
        });

        if (newFriendIds.length > 0) {
            console.log('[RealTime] Subscribed to', newFriendIds.length, 'friend(s) presence');
        }
    }, [friends]);

    // ==================== EVENT HANDLERS ====================

    const handleFriendEvent = useCallback((event) => {
        console.log('[RealTime] Friend event:', event);

        switch (event.event || event.type) {
            case 'FRIEND_REQUEST_RECEIVED':
                setPendingRequests(prev => [...prev, {
                    requesterId: event.requesterId,
                    requesterName: event.requesterName,
                    presence: event.presence,
                    requestedAt: new Date().toISOString()
                }]);
                break;

            case 'FRIEND_REQUEST_ACCEPTED':
                setFriends(prev => {
                    if (prev.some(f => f.friendUserId === event.friendId)) return prev;
                    return [...prev, {
                        friendUserId: event.friendId,
                        name: event.friendName,
                        presenceStatus: event.presence || 'OFFLINE'
                    }];
                });
                setPendingRequests(prev => prev.filter(r => r.requesterId !== event.friendId));
                break;

            case 'FRIEND_REQUEST_REJECTED':
                setPendingRequests(prev => prev.filter(r => r.requesterId !== event.friendId));
                break;

            case 'FRIEND_REMOVED':
                setFriends(prev => prev.filter(f => f.friendUserId !== event.friendId));
                // We should also look into cleaning up the specific subscription here,
                // but doing it on full cleanup/reconnect is safer for now.
                break;
        }
    }, []);

    // ==================== WEBSOCKET CONNECTION ====================

    const setupWebSocket = useCallback(() => {
        const token = getToken();
        if (!token || !isAuthenticated) return;

        if (isSettingUpRef.current) return;
        isSettingUpRef.current = true;

        console.log('[RealTime] Setting up WebSocket...');

        connectChatSocket(
            token,
            () => { }, // message handler
            () => {
                console.log('[RealTime] WebSocket connected');
                setConnectionError(null);
                isSettingUpRef.current = false;
                // Presence subscriptions handled by connection listener
            },
            (error) => {
                console.error('[RealTime] WebSocket error:', error);
                setConnectionError(error);
                isSettingUpRef.current = false;
            }
        );

        // Register friend event listener
        const friendUnsub = addListener('friend', handleFriendEvent);
        listenersRef.current.push(friendUnsub);

    }, [isAuthenticated, handleFriendEvent]);

    // ==================== LIFECYCLE ====================

    // Listen to WebSocket connection state changes
    useEffect(() => {
        const unsub = onConnectionChange((connected) => {
            console.log('[RealTime] Connection state:', connected);
            setIsConnected(connected);

            if (connected && friends.length > 0) {
                // Re-setup subscriptions: Clean old ones first to prevent duplicates
                cleanupPresenceSubscriptions();
                setupPresenceSubscriptions();
            }
        });

        return () => unsub();
    }, [friends.length, setupPresenceSubscriptions, cleanupPresenceSubscriptions]);

    // Fetch data when user is available
    useEffect(() => {
        if (user && !hasFetched) {
            fetchAllData();
        } else if (!user) {
            setFriends([]);
            setPendingRequests([]);
            setRecentlyMet([]);
            setHasFetched(false);
            setIsLoading(true);
        }
    }, [user, hasFetched, fetchAllData]);

    // Setup WebSocket when authenticated and data is loaded
    useEffect(() => {
        if (isAuthenticated && !isLoading && hasFetched) {
            setupWebSocket();
        }

        return () => {
            listenersRef.current.forEach(unsub => unsub?.());
            listenersRef.current = [];
        };
    }, [isAuthenticated, isLoading, hasFetched, setupWebSocket]);

    // Subscribe to presence when connected and have friends
    useEffect(() => {
        // Only run initial setup, rely on onConnectionChange for reconnects
        // But we DO need to run this if friends list changes while connected
        if (isConnected && friends.length > 0) {
            setupPresenceSubscriptions();
        }
    }, [isConnected, friends.length, setupPresenceSubscriptions]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupPresenceSubscriptions();
            isSettingUpRef.current = false;
        };
    }, [cleanupPresenceSubscriptions]);

    // ==================== ACTIONS ====================

    const refreshFriends = useCallback(async () => {
        try {
            const res = await friendsApi.getFriends();
            setFriends(res.data || []);
        } catch (err) {
            console.error('[RealTime] Failed to refresh friends:', err);
        }
    }, []);

    const refreshRequests = useCallback(async () => {
        try {
            const res = await friendsApi.getPendingRequests();
            setPendingRequests(res.data || []);
        } catch (err) {
            console.error('[RealTime] Failed to refresh requests:', err);
        }
    }, []);

    const refreshRecentlyMet = useCallback(async () => {
        try {
            const res = await friendsApi.getRecentlyMet();
            setRecentlyMet(res.data || []);
        } catch (err) {
            console.error('[RealTime] Failed to refresh recently met:', err);
        }
    }, []);

    const updateFriendPresence = useCallback((userId, status) => {
        setFriends(prev => prev.map(f =>
            f.friendUserId === userId ? { ...f, presenceStatus: status } : f
        ));
    }, []);

    const removeFriendLocally = useCallback((userId) => {
        setFriends(prev => prev.filter(f => f.friendUserId !== userId));
    }, []);

    const removeRequestLocally = useCallback((requesterId) => {
        setPendingRequests(prev => prev.filter(r => r.requesterId !== requesterId));
    }, []);

    const removeRecentlyMetLocally = useCallback((userId) => {
        setRecentlyMet(prev => prev.filter(r => r.metUserId !== userId));
    }, []);

    const value = {
        isConnected,
        connectionError,
        isLoading,
        friends,
        pendingRequests,
        recentlyMet,
        friendsOnline,
        friendsInSession,
        pendingRequestCount: pendingRequests.length,
        refreshFriends,
        refreshRequests,
        refreshRecentlyMet,
        refreshAll: fetchAllData,
        updateFriendPresence,
        removeFriendLocally,
        removeRequestLocally,
        removeRecentlyMetLocally,
    };

    return (
        <RealTimeContext.Provider value={value}>
            {children}
        </RealTimeContext.Provider>
    );
};

export default RealTimeContext;
