import { useState, useEffect } from 'react';
import { pushApi } from '../api/push';

function sanitizeVapidPublicKey(value) {
    if (!value) return '';
    let key = String(value).trim();
    if (
        (key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))
    ) {
        key = key.slice(1, -1);
    }
    return key
        .replace(/\s+/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function arrayBufferToBase64Url(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function normalizeBase64Url(value) {
    if (!value) return '';
    return String(value).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function subscriptionKeyMatches(subscription, backendPublicKey) {
    const current = subscription?.options?.applicationServerKey;
    if (!current || !backendPublicKey) return true;
    const currentKey = arrayBufferToBase64Url(current);
    const expectedKey = normalizeBase64Url(sanitizeVapidPublicKey(backendPublicKey));
    return currentKey === expectedKey;
}

function getValidatedApplicationServerKey(rawKey) {
    const sanitized = sanitizeVapidPublicKey(rawKey);
    const keyBytes = urlBase64ToUint8Array(sanitized);
    // Uncompressed P-256 public key must be 65 bytes for Web Push.
    if (keyBytes.byteLength !== 65) {
        throw new Error('Invalid VAPID public key format');
    }
    return { sanitized, keyBytes };
}

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState('default'); // default, granted, denied
    const [error, setError] = useState('');

    useEffect(() => {
        // 1. Check browser support
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            setError('');
            if (Notification.permission === 'denied') {
                setLoading(false);
                return;
            }

            // Register SW if needed
            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                setIsSubscribed(false);
                return;
            }

            // Keep backend in sync with existing browser subscription.
            const { data } = await pushApi.getPublicKey();
            const backendPublicKey = sanitizeVapidPublicKey(data?.publicKey);
            if (!backendPublicKey) {
                setIsSubscribed(false);
                setError('Push is not configured on server');
                return;
            }

            if (!subscriptionKeyMatches(subscription, backendPublicKey)) {
                await subscription.unsubscribe();
                const { keyBytes: applicationServerKey } = getValidatedApplicationServerKey(backendPublicKey);
                const freshSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
                await pushApi.subscribe(freshSubscription);
                setIsSubscribed(true);
                return;
            }

            try {
                await pushApi.subscribe(subscription);
                setIsSubscribed(true);
            } catch {
                // Existing subscription can be stale/corrupt after account switches.
                await subscription.unsubscribe();
                const { keyBytes: applicationServerKey } = getValidatedApplicationServerKey(backendPublicKey);
                const freshSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
                await pushApi.subscribe(freshSubscription);
                setIsSubscribed(true);
            }
        } catch (err) {
            console.error('Failed to check push subscription', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to initialize push');
        } finally {
            setLoading(false);
        }
    };

    const enablePush = async () => {
        if (!isSupported) return;

        try {
            setLoading(true);
            setError('');

            // 1. Ask Permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                throw new Error('Permission denied');
            }

            // 2. Register SW
            const registration = await navigator.serviceWorker.register('/sw.js');

            // 3. Get Public Key from Backend
            const { data } = await pushApi.getPublicKey();
            const backendPublicKey = sanitizeVapidPublicKey(data?.publicKey);
            if (!backendPublicKey) {
                throw new Error('Missing VAPID public key from server');
            }
            const { keyBytes: applicationServerKey } = getValidatedApplicationServerKey(backendPublicKey);

            // 4. Reuse or refresh existing subscription
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                if (subscriptionKeyMatches(existingSubscription, backendPublicKey)) {
                    try {
                        await pushApi.subscribe(existingSubscription);
                        setIsSubscribed(true);
                        return true;
                    } catch {
                        await existingSubscription.unsubscribe();
                    }
                }
                if (await registration.pushManager.getSubscription()) {
                    await existingSubscription.unsubscribe();
                }
            }

            // 5. Subscribe in Browser
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // 6. Send to Backend
            await pushApi.subscribe(subscription);

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error('Failed to enable push notifications', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to enable push');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const disablePush = async () => {
        try {
            setLoading(true);
            setError('');
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe locally
                await subscription.unsubscribe();

                // Notify backend (fire and forget)
                pushApi.unsubscribe(subscription.endpoint).catch(console.error);

                setIsSubscribed(false);
            }
        } catch (err) {
            console.error('Failed to disable push', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to disable push');
        } finally {
            setLoading(false);
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        error,
        loading,
        enablePush,
        disablePush
    };
};
