import { useState, useEffect } from 'react';
import { pushApi } from '../api/push';

function isIosDevice() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const iPadOs = platform === 'MacIntel' && maxTouchPoints > 1;
    return /iPhone|iPad|iPod/i.test(ua) || iPadOs;
}

function isStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
}

function isAndroidDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
}

function isLikelyInAppBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /; wv\)|FBAN|FBAV|Instagram|Line|MiuiBrowser|HuaweiBrowser/i.test(ua);
}

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

async function subscribeWithRecovery(registration, applicationServerKey) {
    try {
        return await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
        });
    } catch (error) {
        const message = String(error?.message || '');
        const isRecoverable =
            message.toLowerCase().includes('push service error') ||
            error?.name === 'AbortError' ||
            error?.name === 'InvalidStateError';

        if (!isRecoverable) {
            throw error;
        }

        // If browser already has a usable subscription, reuse it.
        const existingBeforeRetry = await registration.pushManager.getSubscription();
        if (existingBeforeRetry) {
            return existingBeforeRetry;
        }

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            await existing.unsubscribe().catch(() => { });
        }

        await registration.update().catch(() => { });
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
            return await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
        } catch (retryError) {
            const retryMessage = String(retryError?.message || '').toLowerCase();
            const retryRecoverable =
                retryMessage.includes('push service error') ||
                retryError?.name === 'AbortError' ||
                retryError?.name === 'InvalidStateError';

            if (!retryRecoverable) {
                throw retryError;
            }

            // Last recovery: re-register service worker and try once more.
            const freshRegistration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            await freshRegistration.update().catch(() => { });
            await new Promise((resolve) => setTimeout(resolve, 300));

            return freshRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
        }
    }
}

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState('default'); // default, granted, denied
    const [error, setError] = useState('');

    const syncPermissionState = () => {
        if (typeof Notification === 'undefined') return 'default';
        const current = Notification.permission;
        setPermission(current);
        if (current !== 'granted') {
            setIsSubscribed(false);
        }
        return current;
    };

    useEffect(() => {
        const hasNotificationApi = typeof Notification !== 'undefined';
        const supportsPush = hasNotificationApi && 'serviceWorker' in navigator && 'PushManager' in window;

        if (!window.isSecureContext) {
            setIsSupported(false);
            setPermission(hasNotificationApi ? Notification.permission : 'default');
            setError('Push notifications require HTTPS. Open the app over a secure connection.');
            setLoading(false);
            return;
        }

        // iOS web push works only from Home Screen installed app (standalone mode).
        if (supportsPush && isIosDevice() && !isStandaloneMode()) {
            setIsSupported(false);
            setPermission(hasNotificationApi ? Notification.permission : 'default');
            setError('On iPhone/iPad, install Continuum to Home Screen and open it from there to enable push notifications.');
            setLoading(false);
            return;
        }

        if (supportsPush && isAndroidDevice() && isLikelyInAppBrowser()) {
            setIsSupported(false);
            setPermission(hasNotificationApi ? Notification.permission : 'default');
            setError('Push is not supported in this in-app browser. Open Continuum in Chrome/Edge/Firefox on Android.');
            setLoading(false);
            return;
        }

        if (supportsPush) {
            setIsSupported(true);
            syncPermissionState();
            checkSubscription();
        } else {
            setLoading(false);
        }

        const refreshPermission = () => {
            const current = syncPermissionState();
            if (current === 'granted') {
                checkSubscription();
            }
        };

        document.addEventListener('visibilitychange', refreshPermission);
        window.addEventListener('focus', refreshPermission);

        let permissionStatus;
        let permissionChangeHandler;
        if (navigator.permissions?.query) {
            navigator.permissions.query({ name: 'notifications' }).then((status) => {
                permissionStatus = status;
                permissionChangeHandler = () => refreshPermission();
                status.addEventListener?.('change', permissionChangeHandler);
            }).catch(() => { });
        }

        return () => {
            document.removeEventListener('visibilitychange', refreshPermission);
            window.removeEventListener('focus', refreshPermission);
            if (permissionStatus && permissionChangeHandler) {
                permissionStatus.removeEventListener?.('change', permissionChangeHandler);
            }
        };
    }, []);

    const checkSubscription = async () => {
        try {
            setError('');
            const currentPermission = syncPermissionState();
            if (currentPermission !== 'granted') {
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
                const freshSubscription = await subscribeWithRecovery(registration, applicationServerKey);
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
                const freshSubscription = await subscribeWithRecovery(registration, applicationServerKey);
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

            if (!window.isSecureContext) {
                throw new Error('Push notifications require HTTPS');
            }

            // 1. Ask Permission only if still promptable
            let perm = Notification.permission;
            if (perm === 'default') {
                perm = await Notification.requestPermission();
            }
            setPermission(perm);

            if (perm !== 'granted') {
                if (perm === 'denied') {
                    throw new Error('Notification permission is blocked in browser settings');
                }
                throw new Error('Notification permission was dismissed');
            }

            // 2. Register SW
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            await registration.update().catch(() => { });

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
            const subscription = await subscribeWithRecovery(registration, applicationServerKey);

            // 6. Send to Backend
            await pushApi.subscribe(subscription);

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error('Failed to enable push notifications', err);
            const rawMessage = err?.response?.data?.message || err?.message || 'Failed to enable push';
            const normalized = String(rawMessage).toLowerCase();
            if (normalized.includes('push service error')) {
                setError('Browser push service rejected registration. Disable VPN/ad-blocker, clear site data, and retry.');
            } else {
                setError(rawMessage);
            }
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
