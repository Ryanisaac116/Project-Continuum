import { Client } from '@stomp/stompjs';
import { getWsUrl } from '../api/client';

/**
 * Chat WebSocket - Handles real-time messaging and events
 * 
 * OPTIMIZED for instant updates:
 * - Fast reconnection (1-2 seconds)
 * - Heartbeat to detect stale connections
 * - Multiple listeners pattern
 * - Connection state management
 * 
 * Channels:
 * - /user/queue/messages (chat messages)
 * - /user/queue/friends (friend events)
 * - /user/queue/calls (call events)
 * - /user/queue/notifications (notifications)
 * - /user/queue/session (session events)
 * - /topic/presence/{userId} (presence updates)
 */

let client = null;
let connected = false;
let presenceSubscriptions = {};
let reconnectAttempts = 0;
let connectionCallbacks = { onConnected: null, onError: null };

// Event listeners by type (multiple listeners per type)
const listeners = {
    message: new Set(),
    friend: new Set(),
    call: new Set(),
    notification: new Set(),
    callSignal: new Set(),
    presence: new Map(),
    connectionChange: new Set(), // NEW: listen to connection state changes
    match: new Set(), // NEW: listen to match events
    session: new Set(), // NEW: listen to session events
};

/**
 * Add a listener for an event type
 * @returns {function} Unsubscribe function
 */
export const addListener = (type, callback) => {
    if (type === 'presence') {
        throw new Error('Use subscribeToPresence for presence events');
    }

    if (!listeners[type]) {
        console.warn(`Unknown event type: ${type}`);
        return () => { };
    }

    listeners[type].add(callback);

    return () => {
        listeners[type].delete(callback);
    };
};

/**
 * Subscribe to connection state changes
 */
export const onConnectionChange = (callback) => {
    listeners.connectionChange.add(callback);
    // Immediately call with current state
    callback(connected);
    return () => listeners.connectionChange.delete(callback);
};

/**
 * Emit event to all listeners of a type
 */
const emit = (type, data) => {
    if (listeners[type]) {
        listeners[type].forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[ChatSocket] Listener error for ${type}:`, err);
            }
        });
    }
};

/**
 * Notify connection state change
 */
const notifyConnectionChange = (isConnected) => {
    listeners.connectionChange.forEach(cb => {
        try {
            cb(isConnected);
        } catch (err) {
            console.error('[ChatSocket] Connection change listener error:', err);
        }
    });
};

// Legacy callbacks for backwards compatibility
let onMessageCallback = null;
let onFriendEventCallback = null;
let onCallEventCallback = null;
let onNotificationCallback = null;

export const updateMessageCallback = (callback) => {
    onMessageCallback = callback;
};

export const updateFriendEventCallback = (callback) => {
    onFriendEventCallback = callback;
};

export const updateCallEventCallback = (callback) => {
    onCallEventCallback = callback;
};

export const updateNotificationCallback = (callback) => {
    onNotificationCallback = callback;
};

/**
 * Setup all subscriptions after connection
 */
const setupSubscriptions = () => {
    if (!client || !client.connected) return;

    try {
        // Messages
        client.subscribe('/user/queue/messages', (message) => {
            const msg = JSON.parse(message.body);
            emit('message', msg);
            if (onMessageCallback) onMessageCallback(msg);
        });

        // Session events
        client.subscribe('/user/queue/session', (message) => {
            const data = JSON.parse(message.body);


            // Normalize event type (backend sends 'type' or 'event')
            const eventType = data.type || data.event;

            // Emit generic session event
            emit('session', { ...data, event: eventType });

            if (eventType === 'session_invalidated') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert(data.message || 'You were logged out because your account was used on another device.');
                window.location.href = '/login';
            }
        });

        // Friend events
        client.subscribe('/user/queue/friends', (message) => {
            const data = JSON.parse(message.body);

            emit('friend', data);
            if (onFriendEventCallback) onFriendEventCallback(data);
        });

        // Call events
        client.subscribe('/user/queue/calls', (message) => {
            const data = JSON.parse(message.body);

            emit('call', data);
            if (onCallEventCallback) onCallEventCallback(data);
        });

        // Notifications
        client.subscribe('/user/queue/notifications', (message) => {
            const data = JSON.parse(message.body);

            emit('notification', data);
            if (onNotificationCallback) onNotificationCallback(data);
        });

        // WebRTC Call Signaling
        client.subscribe('/user/queue/call-signal', (message) => {
            const data = JSON.parse(message.body);

            emit('callSignal', data);
        });

        // Match events (from Matching Service)
        client.subscribe('/user/queue/match', (message) => {
            const data = JSON.parse(message.body);

            emit('match', data);
        });

        // Session events (Started, Ended)
        client.subscribe('/user/queue/session', (message) => {
            const data = JSON.parse(message.body);

            emit('session', data);
        });

        // Re-subscribe to presence for existing subscriptions
        Object.keys(presenceSubscriptions).forEach(userId => {
            resubscribeToPresence(Number(userId));
        });

    } catch (err) {
        console.error('[ChatSocket] Subscribe error:', err);
    }
};

/**
 * Re-subscribe to presence for a specific user (after reconnect)
 */
const resubscribeToPresence = (userId) => {
    if (!client || !client.connected) return;

    try {
        const subscription = client.subscribe(
            `/topic/presence/${userId}`,
            (message) => {
                const presence = JSON.parse(message.body);
                const userCallbacks = listeners.presence.get(userId);
                if (userCallbacks) {
                    userCallbacks.forEach(cb => {
                        try {
                            cb(presence);
                        } catch (err) {
                            console.error('[ChatSocket] Presence callback error:', err);
                        }
                    });
                }
            }
        );

        // Update subscription reference
        if (presenceSubscriptions[userId]) {
            try {
                presenceSubscriptions[userId].unsubscribe();
            } catch (e) { /* ignore */ }
        }
        presenceSubscriptions[userId] = subscription;
    } catch (err) {
        console.error('[ChatSocket] Presence resubscribe error:', err);
    }
};

/**
 * Connect to WebSocket with optimized settings
 */
export const connectChatSocket = (token, onMessage, onConnected, onError) => {
    onMessageCallback = onMessage;
    connectionCallbacks = { onConnected, onError };

    if (client && connected) {
        onConnected?.();
        return;
    }

    // Disconnect existing client if any
    if (client) {
        try {
            client.deactivate();
        } catch (e) { /* ignore */ }
        client = null;
    }

    const wsUrl = getWsUrl(token);


    client = new Client({
        brokerURL: wsUrl,
        // OPTIMIZED: Faster reconnection
        reconnectDelay: 1000, // Start at 1 second
        // Heartbeat for connection health
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        // Disable debug in production
        debug: () => { },
        // Connection timeout
        connectionTimeout: 5000,
    });

    client.onConnect = () => {
        connected = true;
        reconnectAttempts = 0;


        setupSubscriptions();
        notifyConnectionChange(true);
        connectionCallbacks.onConnected?.();
    };

    client.onDisconnect = () => {
        connected = false;

        notifyConnectionChange(false);
    };

    client.onWebSocketClose = () => {
        connected = false;

        notifyConnectionChange(false);
        connectionCallbacks.onError?.('Disconnected');
    };

    client.onStompError = (frame) => {
        console.error('[ChatSocket] STOMP error:', frame.headers['message']);
        connectionCallbacks.onError?.(frame.headers['message']);
    };

    client.activate();
};

/**
 * Send a chat message
 */
export const sendChatMessage = (recipientId, content, replyToMessageId = null) => {
    if (!client || !connected) {
        console.error('Chat socket not connected');
        return;
    }

    const payload = { recipientId, content };
    if (replyToMessageId) {
        payload.replyToId = replyToMessageId;
    }

    client.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload),
    });
};

/**
 * Subscribe to presence updates for a user
 * Supports multiple subscribers per user
 */
export const subscribeToPresence = (userId, callback) => {
    if (!client || !connected || !client.connected) {
        console.warn('[ChatSocket] Cannot subscribe to presence - socket not connected');
        return () => { };
    }

    // Initialize listener set for this user if needed
    if (!listeners.presence.has(userId)) {
        listeners.presence.set(userId, new Set());
    }

    const userListeners = listeners.presence.get(userId);
    userListeners.add(callback);

    // Create STOMP subscription if first listener for this user
    if (!presenceSubscriptions[userId]) {
        try {
            const subscription = client.subscribe(
                `/topic/presence/${userId}`,
                (message) => {
                    const presence = JSON.parse(message.body);
                    const userCallbacks = listeners.presence.get(userId);
                    if (userCallbacks) {
                        userCallbacks.forEach(cb => {
                            try {
                                cb(presence);
                            } catch (err) {
                                console.error('[ChatSocket] Presence callback error:', err);
                            }
                        });
                    }
                }
            );

            presenceSubscriptions[userId] = subscription;
        } catch (err) {
            console.error('[ChatSocket] Presence subscribe error:', err);
            return () => { };
        }
    }

    // Return unsubscribe function
    return () => {
        userListeners.delete(callback);

        // If no more listeners for this user, unsubscribe from STOMP
        if (userListeners.size === 0) {
            listeners.presence.delete(userId);
            if (presenceSubscriptions[userId]) {
                try {
                    presenceSubscriptions[userId].unsubscribe();
                } catch (e) {
                    console.warn('[ChatSocket] Unsubscribe error:', e);
                }
                delete presenceSubscriptions[userId];
            }
        }
    };
};

/**
 * Disconnect WebSocket
 */
export const disconnectChatSocket = () => {
    Object.values(presenceSubscriptions).forEach((sub) => {
        try {
            sub.unsubscribe();
        } catch (e) { }
    });
    presenceSubscriptions = {};
    listeners.presence.clear();

    if (client) {
        client.deactivate();
        client = null;
    }
    connected = false;
    onMessageCallback = null;
    onFriendEventCallback = null;
    onCallEventCallback = null;
    onNotificationCallback = null;
    listeners.callSignal.clear();
    listeners.connectionChange.clear();
    notifyConnectionChange(false);
};

export const isChatConnected = () => connected;

/**
 * Force reconnect
 */
export const forceReconnect = () => {
    if (client) {

        client.deactivate();
        setTimeout(() => {
            client.activate();
        }, 100);
    }
};

/**
 * Subscribe to WebRTC call signals
 */
export const subscribeToCallSignal = (callback) => {
    listeners.callSignal.add(callback);
    return () => {
        listeners.callSignal.delete(callback);
    };
};

/**
 * Send WebRTC call signal
 */
export const sendCallSignal = (message) => {
    if (!client || !connected) {
        console.error('[ChatSocket] Cannot send call signal - not connected');
        return;
    }

    client.publish({
        destination: '/app/call.signal',
        body: JSON.stringify(message)
    });
};
