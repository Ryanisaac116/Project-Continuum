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
                    }
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

    return (
        <div
            onClick={handleClick}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-black/30 border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition animate-slide-in max-w-sm"
        >
            <span className="text-2xl">{getIcon()}</span>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm">{notification.title}</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs truncate">{notification.message}</div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
        <div className="fixed top-4 right-4 z-50 space-y-2">
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
