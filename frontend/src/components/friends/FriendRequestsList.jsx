import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * FriendRequestsList - Display pending incoming friend requests
 * 
 * Phase 3: With accept/reject actions
 * 
 * Props:
 * - requests: Array<{ requesterId, requesterName, presence, requestedAt }>
 * - onAccept: (requesterId, requesterName, presence) => void
 * - onReject: (requesterId) => void
 * - pendingActions: { [key]: boolean }
 */
const FriendRequestsList = ({ requests, onAccept, onReject, pendingActions = {} }) => {
    if (!requests || requests.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
                No pending friend requests
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
            {requests.map((request) => {
                const isAccepting = pendingActions[`accept-${request.requesterId}`];
                const isRejecting = pendingActions[`reject-${request.requesterId}`];
                const isAnyPending = isAccepting || isRejecting;

                return (
                    <li key={request.requesterId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-muted/50 transition-colors">
                        {/* User Info */}
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            {/* Avatar placeholder */}
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                                {request.requesterName?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div>
                                <div className="font-medium">{request.requesterName}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {request.requestedAt
                                        ? `Requested ${formatRelativeTime(request.requestedAt)}`
                                        : 'Pending request'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Presence + Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                            <div className="hidden sm:block">
                                <Badge variant={request.presence === 'ONLINE' ? 'default' : 'secondary'} className={cn(
                                    request.presence === 'ONLINE' && "bg-green-500 hover:bg-green-600"
                                )}>
                                    {request.presence || 'OFFLINE'}
                                </Badge>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => onAccept(request.requesterId, request.requesterName, request.presence)}
                                disabled={isAnyPending}
                                className={cn(
                                    "bg-green-600 hover:bg-green-700",
                                    isAnyPending && "opacity-50"
                                )}
                            >
                                {isAccepting ? 'Accepting...' : 'Accept'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReject(request.requesterId)}
                                disabled={isAnyPending}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                {isRejecting ? 'Declining...' : 'Decline'}
                            </Button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

/**
 * Format a timestamp as relative time
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

export default FriendRequestsList;
