import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
                    <li key={user.userId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-muted/50 transition-colors">
                        {/* User Info */}
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            {/* Avatar placeholder */}
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {user.lastSessionAt
                                        ? `Last session: ${formatRelativeTime(user.lastSessionAt)}`
                                        : 'Recently met'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Presence + Action */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                            <div className="hidden sm:block">
                                <Badge variant={user.presence === 'ONLINE' ? 'default' : 'secondary'} className={cn(
                                    user.presence === 'ONLINE' && "bg-green-500 hover:bg-green-600"
                                )}>
                                    {user.presence || 'OFFLINE'}
                                </Badge>
                            </div>

                            <Button
                                size="sm"
                                variant={isPending ? "secondary" : "outline"}
                                disabled={isPending}
                                onClick={() => onSendRequest(user.userId)}
                            >
                                {isPending ? 'Sending...' : 'Add Friend'}
                            </Button>
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
