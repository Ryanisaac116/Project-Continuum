/**
 * PresenceBadge - WhatsApp-style presence indicator
 * 
 * Shows:
 * - "Online" when user is online
 * - "Last seen X ago" when user is offline
 * 
 * Note: Uses inherited text color for flexibility in light/dark headers
 */

const PresenceBadge = ({ status, lastSeenAt }) => {
    // Debug logging
    console.log('[PresenceBadge] Received:', { status, lastSeenAt });

    const isOnline = status === 'ONLINE';
    const isBusy = status === 'BUSY';
    const isInSession = status === 'IN_SESSION';

    // Format last seen time
    const getLastSeenText = () => {
        if (!lastSeenAt) return 'Offline';

        // Server sends LocalDateTime in MST (UTC-07:00)
        // Append timezone offset so browser knows the correct time
        let timestamp = lastSeenAt;
        if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
            // No timezone info - append server timezone (MST = -07:00)
            timestamp = timestamp + '-07:00';
        }

        const lastSeen = new Date(timestamp);
        const now = new Date();
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        // Debug: show actual calculations
        console.log('[PresenceBadge] Time calculation:', {
            rawTimestamp: lastSeenAt,
            parsedLastSeen: lastSeen.toString(),
            nowTime: now.toString(),
            diffMs,
            diffMins,
            diffHours
        });

        if (diffMins < 0) return 'online'; // Future time means clock skew
        if (diffMins < 1) return 'last seen just now';
        if (diffMins < 60) return `last seen ${diffMins}m ago`;
        if (diffHours < 24) return `last seen ${diffHours}h ago`;
        if (diffDays === 1) return 'last seen yesterday';
        return `last seen ${diffDays}d ago`;
    };

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
        <span className="text-xs opacity-80">{getLastSeenText()}</span>
    );
};

export default PresenceBadge;
