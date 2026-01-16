import { Client } from '@stomp/stompjs';
import { getWsUrl } from '../api/client';

/**
 * Matching WebSocket - Handles real-time matching events
 * 
 * Channels:
 * - /user/queue/match (matching events: WAITING, MATCH_FOUND, ERROR)
 */

let client = null;
let connected = false;
let subscription = null;
let messageCallback = null;
let onConnectedCallback = null;
let onErrorCallback = null;

/**
 * Connect to matching WebSocket
 */
export const connectMatchingSocket = (token, onMessage, onConnected, onError) => {
    console.log('[MatchingSocket] Connecting...');

    messageCallback = onMessage;
    onConnectedCallback = onConnected;
    onErrorCallback = onError;

    if (client && connected) {
        console.log('[MatchingSocket] Already connected');
        if (onConnected) onConnected();
        return;
    }

    const wsUrl = getWsUrl(token);
    console.log('[MatchingSocket] WebSocket URL:', wsUrl);

    client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
            if (str.includes('ERROR') || str.includes('CONNECTED')) {
                console.log('[MatchingSocket] STOMP:', str);
            }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
            console.log('[MatchingSocket] Connected');
            connected = true;

            // Subscribe to matching events
            subscription = client.subscribe('/user/queue/match', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    console.log('[MatchingSocket] Event received:', data);
                    if (messageCallback) {
                        messageCallback(data);
                    }
                } catch (err) {
                    console.error('[MatchingSocket] Parse error:', err);
                }
            });

            if (onConnectedCallback) {
                onConnectedCallback();
            }
        },

        onStompError: (frame) => {
            console.error('[MatchingSocket] STOMP error:', frame.headers?.message || frame);
            connected = false;
            if (onErrorCallback) {
                onErrorCallback(frame.headers?.message || 'Connection error');
            }
        },

        onWebSocketClose: () => {
            console.log('[MatchingSocket] WebSocket closed');
            connected = false;
        },

        onWebSocketError: (error) => {
            console.error('[MatchingSocket] WebSocket error:', error);
            connected = false;
            if (onErrorCallback) {
                onErrorCallback('WebSocket connection failed');
            }
        },
    });

    client.activate();
};

/**
 * Disconnect from matching WebSocket
 */
export const disconnectMatchingSocket = () => {
    console.log('[MatchingSocket] Disconnecting...');

    if (subscription) {
        try {
            subscription.unsubscribe();
        } catch (e) {
            console.warn('[MatchingSocket] Unsubscribe error:', e);
        }
        subscription = null;
    }

    if (client) {
        try {
            client.deactivate();
        } catch (e) {
            console.warn('[MatchingSocket] Deactivate error:', e);
        }
        client = null;
    }

    connected = false;
    messageCallback = null;
    onConnectedCallback = null;
    onErrorCallback = null;
};

/**
 * Join matching queue with intent
 */
export const joinMatching = (intent) => {
    if (!client || !connected) {
        console.error('[MatchingSocket] Not connected, cannot join');
        return;
    }

    console.log('[MatchingSocket] Joining with intent:', intent);

    client.publish({
        destination: '/app/matching.join',
        body: JSON.stringify(intent),
    });
};

/**
 * Leave matching queue
 */
export const leaveMatching = () => {
    if (!client || !connected) {
        console.warn('[MatchingSocket] Not connected, cannot leave');
        return;
    }

    console.log('[MatchingSocket] Leaving queue');

    client.publish({
        destination: '/app/matching.leave',
        body: '',
    });
};

/**
 * Check if connected
 */
export const isMatchingConnected = () => connected;
