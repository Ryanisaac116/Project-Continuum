import { useNavigate } from 'react-router-dom';
import PresenceBadge from '../ui/PresenceBadge';
import apiClient from '../../api/client';

/**
 * FriendsList - Display accepted friends with presence
 * 
 * Mobile-responsive design with touch-friendly buttons
 */
const FriendsList = ({ friends }) => {
    const navigate = useNavigate();

    const handleCall = async (e, friendId) => {
        e.stopPropagation(); // Prevent row click
        try {
            await apiClient.post('/calls/friend/initiate', { receiverId: friendId });
            // CallOverlay will handle the CALL_RINGING event
        } catch (err) {
            console.error('Failed to initiate call:', err);
            alert(err.response?.data?.message || 'Failed to start call');
        }
    };

    if (!friends || friends.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
                No friends yet. Complete exchanges and send friend requests!
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
            {friends.map((friend) => {
                const isOnline = friend.presenceStatus === 'ONLINE';
                const isInSession = friend.presenceStatus === 'IN_SESSION';
                const canCall = isOnline && !isInSession;

                return (
                    <li
                        key={friend.friendUserId}
                        className="p-3 sm:p-4 flex items-center justify-between gap-2 active:bg-gray-50 dark:active:bg-slate-800/50 transition-colors"
                    >
                        {/* User Info - Tap to chat on mobile */}
                        <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/chat/${friend.friendUserId}`)}
                        >
                            {/* Avatar */}
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-500 font-medium flex-shrink-0 border border-green-200 dark:border-green-500/20 transition-colors">
                                {friend.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white truncate transition-colors">{friend.name}</div>
                                <PresenceBadge
                                    status={friend.presenceStatus}
                                    lastSeenAt={friend.lastSeenAt}
                                />
                            </div>
                        </div>

                        {/* Action buttons - Always visible */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Call Button - Only for ONLINE users */}
                            <button
                                onClick={(e) => handleCall(e, friend.friendUserId)}
                                disabled={!canCall}
                                className={`p-2 sm:px-4 sm:py-2 text-sm rounded-lg transition ${canCall
                                    ? 'bg-green-600/90 text-white hover:bg-green-600 active:bg-green-700 shadow-lg shadow-green-900/20'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-200 dark:border-slate-700'
                                    }`}
                                title={
                                    isInSession ? 'User is in a session'
                                        : !isOnline ? 'User is offline'
                                            : 'Start a call'
                                }
                            >
                                <span className="sm:hidden">📞</span>
                                <span className="hidden sm:inline">📞 Call</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/chat/${friend.friendUserId}`);
                                }}
                                className="p-2 sm:px-4 sm:py-2 text-sm rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 border border-gray-200 dark:border-slate-700 transition-colors"
                            >
                                <span className="sm:hidden">💬</span>
                                <span className="hidden sm:inline">Chat</span>
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default FriendsList;



