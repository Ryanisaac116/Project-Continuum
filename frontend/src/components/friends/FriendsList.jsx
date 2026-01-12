import { useNavigate } from 'react-router-dom';
import PresenceBadge from '../ui/PresenceBadge';

/**
 * FriendsList - Display accepted friends with presence
 * 
 * Mobile-responsive design with touch-friendly buttons
 */
const FriendsList = ({ friends }) => {
    const navigate = useNavigate();

    if (!friends || friends.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                No friends yet. Complete exchanges and send friend requests!
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-100">
            {friends.map((friend) => (
                <li
                    key={friend.friendUserId}
                    className="p-3 sm:p-4 flex items-center justify-between gap-2 active:bg-gray-50"
                >
                    {/* User Info - Tap to chat on mobile */}
                    <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/chat/${friend.friendUserId}`)}
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium flex-shrink-0">
                            {friend.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{friend.name}</div>
                            <PresenceBadge
                                status={friend.presenceStatus}
                                lastSeenAt={friend.lastSeenAt}
                            />
                        </div>
                    </div>

                    {/* Actions - Hidden on very small screens, tap row instead */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => navigate(`/chat/${friend.friendUserId}`)}
                            className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 active:bg-gray-900 transition"
                        >
                            Chat
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default FriendsList;

