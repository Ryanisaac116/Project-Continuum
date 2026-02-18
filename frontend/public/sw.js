/**
 * Service Worker for Push Notifications
 */

const DEFAULT_ICON = '/continuum_logo_transparent.png?v=4';

function buildNotificationConfig(rawData) {
    const payload = rawData || {};
    const data = payload.data || {};
    const type = data.type || 'SYSTEM';

    const definitions = {
        CHAT_MESSAGE: {
            fallbackTitle: 'New Message',
            fallbackBody: 'You received a new chat message.',
            actionTitle: 'Open Chat',
            fallbackUrl: '/app',
            tag: 'chat',
        },
        CALL_INCOMING: {
            fallbackTitle: 'Incoming Call',
            fallbackBody: 'Someone is calling you on Continuum.',
            actionTitle: 'View Call',
            fallbackUrl: '/app',
            tag: 'call-incoming',
            requireInteraction: true,
        },
        CALL_MISSED: {
            fallbackTitle: 'Missed Call',
            fallbackBody: 'You have a missed call.',
            actionTitle: 'View Chat',
            fallbackUrl: '/friends?section=friends',
            tag: 'call-missed',
        },
        MATCH_FOUND: {
            fallbackTitle: 'Exchange Update',
            fallbackBody: 'Your exchange has an update.',
            actionTitle: 'Open Exchanges',
            fallbackUrl: '/exchanges',
            tag: 'match-found',
        },
        FRIEND_REQUEST_RECEIVED: {
            fallbackTitle: 'Friend Request',
            fallbackBody: 'You received a new friend request.',
            actionTitle: 'View Requests',
            fallbackUrl: '/friends?section=requests',
            tag: 'friend-request',
        },
        FRIEND_REQUEST_ACCEPTED: {
            fallbackTitle: 'Request Accepted',
            fallbackBody: 'Your friend request was accepted.',
            actionTitle: 'View Friends',
            fallbackUrl: '/friends?section=friends',
            tag: 'friend-accepted',
        },
        SYSTEM: {
            fallbackTitle: 'Continuum',
            fallbackBody: 'You have a new notification.',
            actionTitle: 'Open App',
            fallbackUrl: '/app',
            tag: 'system',
        },
    };

    const definition = definitions[type] || definitions.SYSTEM;
    const targetUrl = data.url || definition.fallbackUrl;

    return {
        title: payload.title || definition.fallbackTitle,
        options: {
            body: payload.body || definition.fallbackBody,
            icon: DEFAULT_ICON,
            badge: DEFAULT_ICON,
            tag: `continuum-${definition.tag}`,
            requireInteraction: Boolean(definition.requireInteraction),
            data: {
                ...data,
                type,
                url: targetUrl,
            },
            actions: [
                { action: 'open', title: definition.actionTitle },
                { action: 'dismiss', title: 'Dismiss' },
            ],
        },
    };
}

self.addEventListener('push', function (event) {
    let rawData = {};
    if (event.data) {
        try {
            rawData = event.data.json();
        } catch {
            rawData = { title: 'Continuum', body: event.data.text(), data: { type: 'SYSTEM', url: '/app' } };
        }
    } else {
        rawData = { title: 'Continuum', body: 'You have a new notification', data: { type: 'SYSTEM', url: '/app' } };
    }

    const { title, options } = buildNotificationConfig(rawData);
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const targetPath = event.notification.data?.url || '/app';
    const targetUrl = new URL(targetPath, self.location.origin).toString();

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async function (windowClients) {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.startsWith(self.location.origin)) {
                    if ('navigate' in client) {
                        await client.navigate(targetUrl);
                    }
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});

