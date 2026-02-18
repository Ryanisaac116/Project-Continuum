import apiClient from './client';

export const pushApi = {
    // Get backend VAPID public key
    getPublicKey: () =>
        apiClient.get('/push/vapid-public-key'),

    // Send subscription to backend
    subscribe: (subscription) => {
        const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : null;
        const keys = json?.keys
            ? {
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
            }
            : {
                p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
                auth: arrayBufferToBase64Url(subscription.getKey('auth')),
            };

        return apiClient.post('/push/subscribe', {
            endpoint: subscription.endpoint,
            keys,
        });
    },

    // Unsubscribe (Optional, usually handled by browser + simple backend cleanup)
    unsubscribe: (endpoint) =>
        apiClient.delete('/push/unsubscribe', { data: { endpoint } })
};

// Helper: Convert ArrayBuffer to URL-safe Base64 (Web Push expects base64url).
function arrayBufferToBase64Url(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
