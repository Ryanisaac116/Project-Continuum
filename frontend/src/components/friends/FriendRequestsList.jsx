import { Badge } from '../ui/Badge';

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
            <div className="p-4 text-center text-gray-500 text-sm">
                No pending friend requests
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-100">
            {requests.map((request) => {
                const isAccepting = pendingActions[`accept-${request.requesterId}`];
                const isRejecting = pendingActions[`reject-${request.requesterId}`];
                const isAnyPending = isAccepting || isRejecting;

                return (
                    <li key={request.requesterId} className="p-4 flex items-center justify-between">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                {request.requesterName?.charAt(0)?.toUpperCase() || '?'}
                            </div>

                            <div>
                                <div className="font-medium text-gray-900">{request.requesterName}</div>
                                <div className="text-xs text-gray-500">
                                    {request.requestedAt
                                        ? `Requested ${formatRelativeTime(request.requestedAt)}`
                                        : 'Pending request'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Presence + Actions */}
                        <div className="flex items-center gap-2">
                            <Badge status={request.presence}>{request.presence || 'OFFLINE'}</Badge>

                            <button
                                onClick={() => onAccept(request.requesterId, request.requesterName, request.presence)}
                                disabled={isAnyPending}
                                className={`px-3 py-1 text-sm rounded-lg transition ${isAnyPending
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {isAccepting ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => onReject(request.requesterId)}
                                disabled={isAnyPending}
                                className={`px-3 py-1 text-sm rounded-lg transition ${isAnyPending
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {isRejecting ? 'Declining...' : 'Decline'}
                            </button>
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
