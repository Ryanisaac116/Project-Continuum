/**
 * PresenceBadge - WhatsApp-style presence indicator
 * 
 * Shows:
 * - "Online" when user is online
 * - "Last seen X ago" when user is offline
 * 
 * Note: Uses inherited text color for flexibility in light/dark headers
 */

import { formatRelativeTime } from '../../utils/dateUtils';

const PresenceBadge = ({ status, lastSeenAt }) => {
    const isOnline = status === 'ONLINE';
    const isBusy = status === 'BUSY';
    const isInSession = status === 'IN_SESSION';

    if (isOnline) {
        return (
            <span className="text-xs opacity-90">online</span>
        );
    }

    if (isBusy) {
        return (
            <span className="text-xs opacity-90">in a session</span>
        );
    }

    if (isInSession) {
        return (
            <span className="text-xs opacity-90">in a call</span>
        );
    }

    // Offline - show last seen
    return (
        <span className="text-xs opacity-80">{formatRelativeTime(lastSeenAt)}</span>
    );
};

export default PresenceBadge;
