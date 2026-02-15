import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import { Button } from '@/components/ui/button';
import {
    Bell,
    MessageSquare,
    Zap,
    Phone,
    PhoneMissed,
    Settings,
    Mail,
    AlertTriangle,
    Check,
    Trash2,
    X,
    Inbox
} from 'lucide-react';

/**
 * NotificationCenter - Bell icon with dropdown notification panel
 * Mobile: Full-width panel with backdrop
 * Desktop: Dropdown panel positioned right
 */
const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();
    const dialog = useDialog();

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
                case 'ADMIN_SUPPORT':
                case 'ADMIN_REPORT':
                    navigate('/admin?tab=messages');
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
            case 'CHAT_MESSAGE': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'MATCH_FOUND': return <Zap className="w-5 h-5 text-amber-500" />; // Zap matches exchange theme
            case 'CALL_INCOMING': return <Phone className="w-5 h-5 text-emerald-500" />;
            case 'CALL_MISSED': return <PhoneMissed className="w-5 h-5 text-red-500" />;
            case 'SYSTEM': return <Settings className="w-5 h-5 text-slate-500" />;
            case 'ADMIN_SUPPORT': return <Mail className="w-5 h-5 text-indigo-500" />;
            case 'ADMIN_REPORT': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <Button
                variant="ghost"
                size="icon"
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative rounded-full transition-all duration-300 ${isOpen ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-tada' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
                )}
            </Button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99] sm:hidden animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div
                        ref={panelRef}
                        className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-auto sm:mt-4 sm:w-[400px] glass-panel rounded-2xl z-[100] max-h-[75vh] sm:max-h-[500px] flex flex-col overflow-hidden animate-fade-in-up origin-top-right border border-white/20 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAllAsRead();
                                        }}
                                        className="h-8 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full"
                                        title="Mark all as read"
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1.5" /> Mark all
                                    </Button>
                                )}
                                {notifications.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const ok = await dialog.confirm(
                                                'Clear Notifications',
                                                'Are you sure you want to clear all notifications?',
                                                'Clear All',
                                                'destructive'
                                            );
                                            if (ok) {
                                                clearAllNotifications();
                                            }
                                        }}
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="sm:hidden h-8 w-8 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto flex-1 overscroll-contain">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                        <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-slate-900 dark:text-slate-100 font-medium mb-1">All caught up!</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500">No new notifications for now.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((n) => {
                                        let isAdmin = false;
                                        // Check for manual admin types or payload role
                                        if (n.type === 'ADMIN_SUPPORT' || n.type === 'ADMIN_REPORT') {
                                            isAdmin = true;
                                        } else {
                                            try {
                                                if (n.payload) {
                                                    const p = JSON.parse(n.payload);
                                                    if (p.role === 'ADMIN') isAdmin = true;
                                                }
                                            } catch (e) { /* ignore */ }
                                        }

                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={`px-5 py-4 flex gap-4 cursor-pointer transition-all duration-200 group relative ${isAdmin
                                                    ? (!n.isRead ? 'bg-purple-100 dark:bg-purple-900/40 border-l-4 border-l-purple-500' : 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-300')
                                                    : (!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')
                                                    }`}
                                            >
                                                {/* Unread Indicator Dot */}
                                                {!n.isRead && (
                                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${isAdmin ? 'bg-purple-500' : 'bg-indigo-500'}`} />
                                                )}

                                                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!n.isRead ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/50'
                                                    }`}>
                                                    {getIcon(n.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                                {n.title}
                                                            </p>
                                                            {isAdmin && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-sm shrink-0">
                                                                    ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full shrink-0">
                                                            {formatTime(n.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs leading-relaxed line-clamp-2 ${isAdmin ? 'text-indigo-900/70 dark:text-indigo-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default NotificationCenter;
