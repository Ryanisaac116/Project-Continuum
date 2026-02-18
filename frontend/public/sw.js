/**
 * Service Worker for Push Notifications
 */

self.addEventListener('push', function (event) {
    if (!event.data) {
        event.waitUntil(
            self.registration.showNotification('Continuum', {
                body: 'You have a new notification',
                icon: '/continuum_logo_transparent.png?v=4',
                badge: '/continuum_logo_transparent.png?v=4',
                data: { url: '/' },
                actions: [
                    { action: 'open', title: 'View' }
                ]
            })
        );
        return;
    }

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: 'New Notification', body: event.data.text() };
    }

    const options = {
        body: data.body || 'You have a new message',
        icon: '/continuum_logo_transparent.png?v=4',
        badge: '/continuum_logo_transparent.png?v=4',
        data: data.data || {}, // Custom data (url, etc)
        actions: [
            { action: 'open', title: 'View' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Continuum', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // URL to open
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

