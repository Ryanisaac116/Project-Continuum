/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { addListener, onConnectionChange } from '../ws/chatSocket';
import apiClient, { getToken } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const syncInFlightRef = useRef(false);

    const syncNotifications = useCallback(async () => {
        if (authLoading || !user) return;

        const token = getToken();
        if (!token || syncInFlightRef.current) return;

        syncInFlightRef.current = true;
        try {
            const res = await apiClient.get('/notifications?limit=50');
            const serverNotifications = res.data.notifications || [];
            let adminUnreadCount = 0;
            // Preserve client-side admin notifications (they only live in local state)
            setNotifications((prev) => {
                const adminNotifs = prev.filter(n => String(n.id).startsWith('admin-'));
                adminUnreadCount = adminNotifs.filter(n => !n.isRead).length;
                return [...adminNotifs, ...serverNotifications];
            });
            // Use setTimeout(0) to read the adminUnreadCount after state updater runs
            setTimeout(() => {
                setUnreadCount((res.data.unreadCount || 0) + adminUnreadCount);
            }, 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            syncInFlightRef.current = false;
        }
    }, [authLoading, user]);

    // Fetch notifications on mount
    useEffect(() => {
        syncNotifications();
    }, [syncNotifications]);

    useEffect(() => {
        if (!user && !authLoading) {
            setNotifications([]);
            setUnreadCount(0);
            setToasts([]);
        }
    }, [user, authLoading]);

    // Handle incoming WebSocket notification
    const handleNotification = useCallback((notification) => {
        console.log('[NotificationContext] Received:', notification);

        if (notification.type === 'NOTIFICATIONS_CLEARED') {
            console.log('[NotificationContext] Notification list cleared by server event');
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        if (notification.type === 'NOTIFICATION_READ') {
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
            return;
        }

        // Add to notifications list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast for certain types (SUPPRESS if already in chat)
        const toastTypes = [
            'CHAT_MESSAGE',
            'MATCH_FOUND',
            'CALL_INCOMING',
            'CALL_MISSED',
            'FRIEND_REQUEST_RECEIVED',
            'FRIEND_REQUEST_ACCEPTED'
        ];

        let shouldShowToast = true;

        // Check suppression rules
        if (notification.type === 'CHAT_MESSAGE') {
            try {
                const payload = JSON.parse(notification.payload);
                const currentChatId = window.location.pathname.match(/\/chat\/(\d+)/)?.[1];

                if (currentChatId && String(currentChatId) === String(payload.senderId)) {
                    shouldShowToast = false;
                    console.log('[NotificationContext] Suppressing chat notification (already in chat)');
                }
            } catch (e) {
                console.error('Error parsing payload for suppression check:', e);
            }
        }

        if (shouldShowToast && toastTypes.includes(notification.type)) {
            const toastId = Date.now();
            setToasts((prev) => [...prev, { ...notification, toastId }]);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
            }, 5000);
        }
    }, []);

    // Register WebSocket callback for general notifications
    useEffect(() => {
        const unsubscribe = addListener('notification', handleNotification);
        return () => unsubscribe();
    }, [handleNotification]);

    // Global listener for admin messages — shows toast on ANY page + adds to notification center
    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;

        const handleAdminMessage = (msg) => {
            const isReport = msg.type === 'REPORT';
            const title = `New ${isReport ? 'Report' : 'Support Message'}`;
            const body = `${msg.subject} — ${msg.sender?.name || 'Unknown'}`;

            // Add to notification center so it persists in the bell icon
            const notification = {
                id: `admin-${msg.id}`,
                type: isReport ? 'ADMIN_REPORT' : 'ADMIN_SUPPORT',
                title,
                message: body,
                isRead: false,
                createdAt: msg.createdAt || new Date().toISOString(),
            };
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast (stays for 10 seconds)
            const toastId = Date.now();
            setToasts((prev) => [...prev, {
                id: toastId,
                toastId,
                title,
                message: body,
                type: 'MANUAL',
                manualType: isReport ? 'WARNING' : 'INFO',
            }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
            }, 10000);
        };

        const unsubscribe = addListener('adminMessage', handleAdminMessage);
        return () => unsubscribe();
    }, [user]);

    // Resync on reconnect/focus/visibility without continuous background polling.
    useEffect(() => {
        const unsubscribeConnection = onConnectionChange((connected) => {
            if (connected) {
                syncNotifications();
            }
        });

        const syncIfVisible = () => {
            if (document.visibilityState === 'visible') {
                syncNotifications();
            }
        };

        window.addEventListener('focus', syncIfVisible);
        document.addEventListener('visibilitychange', syncIfVisible);

        return () => {
            unsubscribeConnection();
            window.removeEventListener('focus', syncIfVisible);
            document.removeEventListener('visibilitychange', syncIfVisible);
        };
    }, [syncNotifications]);

    // Safety net: periodic sync to keep notification badges accurate.
    useEffect(() => {
        if (authLoading || !user) return;

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                syncNotifications();
            }
        }, 15000);

        return () => window.clearInterval(timer);
    }, [authLoading, user, syncNotifications]);

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
        // Admin notifications are client-side only — mark locally without API call
        if (String(notificationId).startsWith('admin-')) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            return;
        }
        try {
            await apiClient.post(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    // Clear all notifications
    const clearAllNotifications = async () => {
        try {
            await apiClient.delete('/notifications');
            // We rely on the WebSocket event to clear the UI to ensure sync
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    // Dismiss toast
    const dismissToast = (toastId) => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    };

    // Manual toast trigger
    const addToast = useCallback((title, message, type = 'INFO') => {
        const toastId = Date.now();
        setToasts((prev) => [...prev, { id: toastId, toastId, title, message, type: 'MANUAL', manualType: type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
        }, 5000);
    }, []);

    const value = {
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        dismissToast,
        addToast,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
