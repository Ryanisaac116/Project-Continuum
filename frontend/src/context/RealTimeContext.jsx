/* eslint-disable react-refresh/only-export-components */
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
    const [eventVersion, setEventVersion] = useState({
        all: 0,
        friend: 0,
        session: 0,
        match: 0,
        connection: 0,
    });

    // Refs
    const presenceUnsubsRef = useRef([]);
    const listenersRef = useRef([]);
    const friendIdsRef = useRef(new Set());
    const isSettingUpRef = useRef(false);
    const lastBackgroundSyncRef = useRef(0);
    const connectionWasUpRef = useRef(false);

    // Derived values
    const friendsOnline = friends.filter(f => f.presenceStatus === 'ONLINE').length;
    const friendsInSession = friends.filter(f => f.presenceStatus === 'IN_SESSION').length;

    const bumpEventVersion = useCallback((eventType) => {
        setEventVersion(prev => ({
            ...prev,
            all: (prev.all || 0) + 1,
            [eventType]: (prev[eventType] || 0) + 1,
        }));
    }, []);

    // ==================== DATA FETCHING ====================

    const fetchAllData = useCallback(async ({ silent = false } = {}) => {
        if (!user) return;

        if (!silent) {
            setIsLoading(true);
        }
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
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [user]);

    const syncDataInBackground = useCallback((force = false) => {
        if (!isAuthenticated || !user) return;

        const now = Date.now();
        const minIntervalMs = 10000;
        if (!force && now - lastBackgroundSyncRef.current < minIntervalMs) return;
        lastBackgroundSyncRef.current = now;

        fetchAllData({ silent: true });
    }, [fetchAllData, isAuthenticated, user]);

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

        // Collect all unique user IDs we need to track
        const allTrackedIds = new Set();

        friends.forEach(f => allTrackedIds.add(f.friendUserId));
        recentlyMet.forEach(r => allTrackedIds.add(r.metUserId || r.userId)); // Handle both ID formats if any

        // Filter out already subscribed
        const newIds = [...allTrackedIds].filter(id => !friendIdsRef.current.has(id));

        newIds.forEach(targetId => {
            const unsub = subscribeToPresence(targetId, (update) => {
                // Update Friends List
                setFriends(prev => prev.map(f =>
                    f.friendUserId === update.userId
                        ? { ...f, presenceStatus: update.status, lastSeenAt: update.lastSeenAt }
                        : f
                ));

                // Update Recently Met List (uses 'presence' field)
                setRecentlyMet(prev => prev.map(r =>
                    (r.metUserId === update.userId || r.userId === update.userId)
                        ? { ...r, presence: update.status }
                        : r
                ));
            });
            presenceUnsubsRef.current.push({ targetId, unsub });
            friendIdsRef.current.add(targetId);
        });

    }, [friends, recentlyMet]);

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
        setRecentlyMet(prev => prev.map(r =>
            (r.metUserId === userId || r.userId === userId)
                ? { ...r, presence: status }
                : r
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

    // ==================== EVENT HANDLERS ====================

    const handleFriendEvent = useCallback((event) => {
        bumpEventVersion('friend');

        switch (event.event || event.type) {
            case 'FRIEND_REQUEST_RECEIVED':
                setPendingRequests(prev => {
                    // Deduplicate
                    if (prev.some(r => r.requesterId === event.requesterId)) return prev;
                    return [...prev, {
                        requesterId: event.requesterId,
                        requesterName: event.requesterName,
                        presence: event.presence,
                        requestedAt: new Date().toISOString()
                    }];
                });
                // Remove from Recently Met if they send us a request
                setRecentlyMet(prev => prev.filter(r => {
                    const id = r.metUserId || r.userId;
                    return id !== event.requesterId;
                }));
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
                // Remove from Recently Met if we accept (or they accept)
                setRecentlyMet(prev => prev.filter(r => {
                    const id = r.metUserId || r.userId;
                    return id !== event.friendId;
                }));
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
    }, [bumpEventVersion]);

    const handleSessionEvent = useCallback((event) => {
        bumpEventVersion('session');
        // Refresh recently met on any session activity that implies interaction
        if (['SESSION_STARTED', 'SESSION_ENDED', 'MATCH_FOUND'].includes(event.type) || ['SESSION_STARTED', 'SESSION_ENDED', 'MATCH_FOUND'].includes(event.event)) {
            refreshRecentlyMet();
        }
    }, [bumpEventVersion, refreshRecentlyMet]);

    const handleMatchEvent = useCallback((event) => {
        bumpEventVersion('match');
        if (event.type === 'MATCH_FOUND') {
            refreshRecentlyMet();
        }
    }, [bumpEventVersion, refreshRecentlyMet]);

    // ==================== WEBSOCKET CONNECTION ====================

    const setupWebSocket = useCallback(() => {
        const token = getToken();
        if (!token || !isAuthenticated) return;


        if (isSettingUpRef.current) return;
        isSettingUpRef.current = true;

        const isAdmin = user?.role === 'ADMIN';

        connectChatSocket(
            token,
            () => { }, // message handler
            () => {
                setConnectionError(null);
                isSettingUpRef.current = false;
                // Presence subscriptions handled by connection listener
            },
            (error) => {
                console.error('[RealTime] WebSocket error:', error);
                setConnectionError(error);
                isSettingUpRef.current = false;
            },
            isAdmin
        );

        // Register event listeners
        const friendUnsub = addListener('friend', handleFriendEvent);
        const sessionUnsub = addListener('session', handleSessionEvent);
        const matchUnsub = addListener('match', handleMatchEvent);

        listenersRef.current.push(friendUnsub, sessionUnsub, matchUnsub);

    }, [isAuthenticated, user, handleFriendEvent, handleSessionEvent, handleMatchEvent]);

    // ==================== LIFECYCLE ====================

    // Listen to WebSocket connection state changes
    useEffect(() => {
        const unsub = onConnectionChange((connected) => {
            const wasConnected = connectionWasUpRef.current;
            connectionWasUpRef.current = connected;
            setIsConnected(connected);

            // Run expensive sync logic only on real reconnect transitions.
            if (connected && !wasConnected) {
                bumpEventVersion('connection');
                if (friends.length > 0) {
                    // Re-setup subscriptions: Clean old ones first to prevent duplicates
                    cleanupPresenceSubscriptions();
                    setupPresenceSubscriptions();
                }
                // Pull a fresh snapshot after reconnect to cover missed events.
                syncDataInBackground(true);
            }
        });

        return () => unsub();
    }, [friends.length, setupPresenceSubscriptions, cleanupPresenceSubscriptions, syncDataInBackground, bumpEventVersion]);

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
            setEventVersion({
                all: 0,
                friend: 0,
                session: 0,
                match: 0,
                connection: 0,
            });
        }
    }, [user, hasFetched, fetchAllData]);

    // Setup WebSocket immediately when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            setupWebSocket();
        }

        return () => {
            listenersRef.current.forEach(unsub => unsub?.());
            listenersRef.current = [];
        };
    }, [isAuthenticated, setupWebSocket]);

    // Subscribe to presence when connected and have friends
    useEffect(() => {
        // Only run initial setup, rely on onConnectionChange for reconnects
        // But we DO need to run this if friends list changes while connected
        if (isConnected && friends.length > 0) {
            setupPresenceSubscriptions();
        }
    }, [isConnected, friends.length, setupPresenceSubscriptions]);

    // Upgrade to admin subscription when user role becomes ADMIN after connection
    useEffect(() => {
        if (isConnected && user?.role === 'ADMIN') {
            const token = getToken();
            if (token) {
                connectChatSocket(token, () => { }, () => { }, () => { }, true);
            }
        }
    }, [isConnected, user?.role]);

    // Keep data fresh on focus/visibility transitions without continuous polling.
    useEffect(() => {
        if (!isAuthenticated) return;

        const syncIfVisible = () => {
            if (document.visibilityState === 'visible') {
                syncDataInBackground();
            }
        };

        window.addEventListener('focus', syncIfVisible);
        document.addEventListener('visibilitychange', syncIfVisible);

        return () => {
            window.removeEventListener('focus', syncIfVisible);
            document.removeEventListener('visibilitychange', syncIfVisible);
        };
    }, [isAuthenticated, syncDataInBackground]);

    // Safety net: periodic background sync to keep UI current even if an event is missed.
    useEffect(() => {
        if (!isAuthenticated) return;

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                syncDataInBackground();
            }
        }, 15000);

        return () => window.clearInterval(timer);
    }, [isAuthenticated, syncDataInBackground]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupPresenceSubscriptions();
            isSettingUpRef.current = false;
        };
    }, [cleanupPresenceSubscriptions]);



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
        eventVersion,
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
