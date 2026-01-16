import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationCenter - Bell icon with dropdown notification panel
 * Mobile: Full-width panel with backdrop
 * Desktop: Dropdown panel positioned right
 */
const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Close panel on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        setIsOpen(false);

        try {
            const payload = notification.payload ? JSON.parse(notification.payload) : {};
            switch (notification.type) {
                case 'CHAT_MESSAGE':
                    if (payload.senderId) navigate(`/chat/${payload.senderId}`);
                    break;
                case 'MATCH_FOUND':
                    navigate('/exchanges');
                    break;
                case 'CALL_INCOMING':
                case 'CALL_MISSED':
                    if (payload.callerId) navigate(`/chat/${payload.callerId}`);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.error('Invalid payload:', e);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        return `${diffDays}d ago`;
    };

    const getIcon = (type) => {
        switch (type) {
            case 'CHAT_MESSAGE': return '💬';
            case 'MATCH_FOUND': return '🎯';
            case 'CALL_INCOMING': return '📞';
            case 'CALL_MISSED': return '📵';
            case 'SYSTEM': return '⚙️';
            default: return '🔔';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div
                        className="fixed inset-0 bg-black/30 z-[99] sm:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel - Full width on mobile, dropdown on desktop */}
                    <div
                        ref={panelRef}
                        className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 sm:left-auto top-16 sm:top-auto sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 z-[100] max-h-[75vh] sm:max-h-[400px] overflow-hidden transition-colors"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 transition-colors">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base transition-colors">Notifications</h3>
                            <div className="flex items-center gap-3">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAllAsRead();
                                        }}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="sm:hidden p-1.5 rounded-full hover:bg-gray-100 -mr-1"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[60vh] sm:max-h-80">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 dark:text-slate-500 text-sm transition-colors">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700 border-b border-gray-50 dark:border-slate-800/50 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        <span className="text-xl flex-shrink-0">{getIcon(n.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-gray-100 truncate transition-colors`}>
                                                    {n.title}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 transition-colors">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5 transition-colors">{n.message}</div>
                                        </div>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
