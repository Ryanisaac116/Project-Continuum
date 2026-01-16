import { Badge } from '../ui/Badge';

/**
 * RecentlyMetList - Display users from completed exchange sessions
 * 
 * Phase 3: With send friend request action
 * 
 * Props:
 * - users: Array<{ userId, name, presence, lastSessionAt }>
 * - onSendRequest: (userId) => void
 * - pendingActions: { [key]: boolean }
 */
const RecentlyMetList = ({ users, onSendRequest, pendingActions = {} }) => {
    if (!users || users.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
                No recent exchanges yet. Start matching to meet new people!
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
            {users.map((user) => {
                const isPending = pendingActions[`send-${user.userId}`];

                return (
                    <li key={user.userId} className="p-4 flex items-center justify-between">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 font-medium border border-gray-200 dark:border-slate-700 transition-colors">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div>
                                <div className="font-medium text-gray-900 dark:text-white transition-colors">{user.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-500 transition-colors">
                                    {user.lastSessionAt
                                        ? `Last session: ${formatRelativeTime(user.lastSessionAt)}`
                                        : 'Recently met'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Presence + Action */}
                        <div className="flex items-center gap-3">
                            <Badge status={user.presence}>{user.presence || 'OFFLINE'}</Badge>

                            <button
                                onClick={() => onSendRequest(user.userId)}
                                disabled={isPending}
                                className={`px-3 py-1 text-sm rounded-lg transition ${isPending
                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-200 dark:border-slate-700'
                                    : 'bg-gray-100 dark:bg-slate-100 text-gray-900 dark:text-slate-900 hover:bg-white dark:hover:bg-white font-medium shadow-sm transition-colors'
                                    }`}
                            >
                                {isPending ? 'Sending...' : 'Add Friend'}
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

export default RecentlyMetList;
