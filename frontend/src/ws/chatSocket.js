import { Client } from '@stomp/stompjs';

/**
 * Chat WebSocket - Handles real-time chat messaging
 * 
 * Uses same STOMP broker as matching socket but different subscriptions:
 * - Subscribe: /user/queue/messages (incoming messages)
 * - Subscribe: /topic/presence/{userId} (friend presence updates)
 * - Send: /app/chat (send messages)
 */

let client = null;
let connected = false;
let onMessageCallback = null;
let presenceSubscriptions = {};
let messageSubscription = null;

/**
 * Update the message callback without reconnecting
 */
export const updateMessageCallback = (callback) => {
    onMessageCallback = callback;
};

/**
 * Connect to chat WebSocket
 * @param {string} token - JWT token
 * @param {function} onMessage - Callback for incoming messages
 * @param {function} onConnected - Called when connected
 * @param {function} onError - Called on error
 */
export const connectChatSocket = (token, onMessage, onConnected, onError) => {
    // Update callback even if already connected
    onMessageCallback = onMessage;

    if (client && connected) {
        // Already connected, callback updated above
        onConnected?.();
        return;
    }

    client = new Client({
        brokerURL: `ws://192.168.29.57:8080/ws?token=${token}`,
        reconnectDelay: 5000,
        debug: () => { },
    });

    client.onConnect = () => {
        connected = true;

        // Subscribe to incoming chat messages with safety check
        try {
            if (client && client.connected) {
                messageSubscription = client.subscribe('/user/queue/messages', (message) => {
                    const msg = JSON.parse(message.body);
                    if (onMessageCallback) {
                        onMessageCallback(msg);
                    }
                });

                // Subscribe to session events (for session invalidation)
                client.subscribe('/user/queue/session', (message) => {
                    const data = JSON.parse(message.body);
                    console.log('[ChatSocket] Session event:', data);

                    if (data.event === 'session_invalidated') {
                        // Clear auth and redirect
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');

                        alert(data.message || 'You were logged out because your account was used on another device.');

                        window.location.href = '/login';
                    }
                });
            }
        } catch (err) {
            console.error('[ChatSocket] Subscribe error:', err);
        }

        onConnected?.();
    };

    client.onWebSocketClose = () => {
        connected = false;
        messageSubscription = null;
        onError?.('Disconnected');
    };

    client.activate();
};


/**
 * Send a chat message
 * @param {number} recipientId - Friend's user ID
 * @param {string} content - Message content
 * @param {number} [replyToMessageId] - Optional message ID being replied to
 */
export const sendChatMessage = (recipientId, content, replyToMessageId = null) => {
    if (!client || !connected) {
        console.error('Chat socket not connected');
        return;
    }

    const payload = {
        recipientId,
        content,
    };

    if (replyToMessageId) {
        payload.replyToMessageId = replyToMessageId;
    }

    client.publish({
        destination: '/app/chat',
        body: JSON.stringify(payload),
    });
};

/**
 * Subscribe to a friend's presence updates
 * @param {number} friendId - Friend's user ID  
 * @param {function} onPresenceUpdate - Callback for presence changes
 * @returns {function} Unsubscribe function
 */
export const subscribeToPresence = (friendId, onPresenceUpdate) => {
    // Check both our flag AND the STOMP client's internal state
    if (!client || !connected || !client.connected) {
        console.warn('[ChatSocket] Cannot subscribe to presence - socket not connected');
        return () => { };
    }

    // Avoid duplicate subscriptions
    if (presenceSubscriptions[friendId]) {
        return presenceSubscriptions[friendId].unsubscribe;
    }

    try {
        const subscription = client.subscribe(
            `/topic/presence/${friendId}`,
            (message) => {
                const presence = JSON.parse(message.body);
                onPresenceUpdate(presence);
            }
        );

        presenceSubscriptions[friendId] = {
            subscription,
            unsubscribe: () => {
                try {
                    subscription.unsubscribe();
                } catch (e) {
                    console.warn('[ChatSocket] Unsubscribe error:', e);
                }
                delete presenceSubscriptions[friendId];
            },
        };

        return presenceSubscriptions[friendId].unsubscribe;
    } catch (err) {
        console.error('[ChatSocket] Presence subscribe error:', err);
        return () => { };
    }
};

/**
 * Disconnect chat socket
 */
export const disconnectChatSocket = () => {
    // Unsubscribe from all presence topics
    Object.values(presenceSubscriptions).forEach((sub) => {
        sub.subscription.unsubscribe();
    });
    presenceSubscriptions = {};

    if (client) {
        client.deactivate();
        client = null;
    }
    connected = false;
    onMessageCallback = null;
};

/**
 * Check if chat socket is connected
 */
export const isChatConnected = () => connected;
