import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { updateNotificationCallback } from '../ws/chatSocket';
import apiClient, { getToken } from '../api/client';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);

    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = getToken();
                if (!token) return;

                const res = await apiClient.get('/notifications?limit=50');
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            }
        };

        fetchNotifications();
    }, []);

    // Handle incoming WebSocket notification
    const handleNotification = useCallback((notification) => {
        console.log('[NotificationContext] Received:', notification);

        // Add to notifications list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast for certain types
        // Show toast for certain types (SUPPRESS if already in chat)
        const toastTypes = ['CHAT_MESSAGE', 'MATCH_FOUND', 'CALL_INCOMING', 'CALL_MISSED'];

        let shouldShowToast = true;

        // Check suppression rules
        if (notification.type === 'CHAT_MESSAGE') {
            try {
                const payload = JSON.parse(notification.payload);
                // Extract sender ID from path "/chat/123"
                const currentChatId = window.location.pathname.match(/\/chat\/(\d+)/)?.[1];

                if (currentChatId && String(currentChatId) === String(payload.senderId)) {
                    shouldShowToast = false;
                    console.log('[NotificationContext] Suppressing chat notification (already in chat)');
                    // Optional: Mark as read immediately since we are looking at it? 
                    // (Actually, ChatPage handles read receipts, so just suppressing toast is safer)
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

    // Register WebSocket callback
    useEffect(() => {
        updateNotificationCallback(handleNotification);
        return () => updateNotificationCallback(null);
    }, [handleNotification]);

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
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

    // Dismiss toast
    const dismissToast = (toastId) => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    };

    const value = {
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        dismissToast,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
