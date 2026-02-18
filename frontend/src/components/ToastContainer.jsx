import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * Toast - Non-blocking animated notifications
 */
const Toast = ({ notification, onDismiss }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        // Route based on notification type and payload
        try {
            const payload = notification.payload ? JSON.parse(notification.payload) : {};

            switch (notification.type) {
                case 'CHAT_MESSAGE':
                    if (payload.senderId) {
                        navigate(`/chat/${payload.senderId}`);
                    }
                    break;
                case 'MATCH_FOUND':
                    navigate('/exchanges');
                    break;
                case 'CALL_INCOMING':
                case 'CALL_MISSED':
                    if (payload.callerId) {
                        navigate(`/chat/${payload.callerId}`);
                    } else if (payload.receiverId) {
                        navigate(`/chat/${payload.receiverId}`);
                    } else {
                        navigate('/friends?section=friends');
                    }
                    break;
                case 'FRIEND_REQUEST_RECEIVED':
                    navigate('/friends?section=requests');
                    break;
                case 'FRIEND_REQUEST_ACCEPTED':
                    navigate('/friends?section=friends');
                    break;
                case 'MANUAL':
                    // Admin notifications — navigate to admin messages tab
                    if (notification.manualType === 'INFO' || notification.manualType === 'WARNING') {
                        navigate('/admin?tab=messages');
                    }
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.error('Invalid payload:', e);
        }
        onDismiss();
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'CHAT_MESSAGE': return '💬';
            case 'MATCH_FOUND': return '🎯';
            case 'CALL_INCOMING': return '📞';
            case 'CALL_MISSED': return '📵';
            default: return '🔔';
        }
    };

    let isAdmin = false;
    try {
        if (notification.payload) {
            const p = JSON.parse(notification.payload);
            if (p.role === 'ADMIN') isAdmin = true;
        }
    } catch (e) { /* ignore */ }

    return (
        <div
            onClick={handleClick}
            className={`rounded-lg shadow-lg dark:shadow-black/30 border p-3 sm:p-4 flex items-start gap-3 cursor-pointer transition animate-slide-in max-w-full sm:max-w-sm ${isAdmin
                ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-600 ring-2 ring-purple-500 shadow-purple-500/20'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
        >
            <span className="text-2xl">{getIcon()}</span>
            <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm flex items-center gap-2 ${isAdmin ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>
                    {notification.title}
                    {isAdmin && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-sm shrink-0">
                            ADMIN
                        </span>
                    )}
                </div>
                <div className={`text-xs truncate ${isAdmin ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {notification.message}
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                className={`transition-colors ${isAdmin
                    ? 'text-indigo-400 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-200'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
            >
                ✕
            </button>
        </div>
    );
};

/**
 * ToastContainer - Renders all active toasts
 */
const ToastContainer = () => {
    const { toasts, dismissToast } = useNotifications();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-3 sm:top-4 inset-x-3 sm:inset-x-auto sm:right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.toastId}
                    notification={toast}
                    onDismiss={() => dismissToast(toast.toastId)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
