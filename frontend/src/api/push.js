import apiClient from './client';

export const pushApi = {
    // Get backend VAPID public key
    getPublicKey: () =>
        apiClient.get('/push/vapid-public-key'),

    // Send subscription to backend
    subscribe: (subscription) =>
        apiClient.post('/push/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                auth: arrayBufferToBase64(subscription.getKey('auth'))
            }
        }),

    // Unsubscribe (Optional, usually handled by browser + simple backend cleanup)
    unsubscribe: (endpoint) =>
        apiClient.delete('/push/unsubscribe', { data: { endpoint } })
};

// Helper: Convert ArrayBuffer to Base64 string for backend compatibility
function arrayBufferToBase64(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
