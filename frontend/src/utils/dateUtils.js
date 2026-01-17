/**
 * Formats a timestamp string into a local time string (e.g., "9:41 AM").
 * Handles UTC ISO strings explicitly.
 */
export function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Formats a date separator (e.g., "Today", "Yesterday", "Mon, Jan 1").
 */
export function formatDateSeparator(timestamp) {
    if (!timestamp) return '';
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = msgDate.toDateString() === today.toDateString();
    const isYesterday = msgDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return msgDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Checks if two dates are on the same day.
 */
export function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
}

/**
 * Formats a timestamp as a relative string (e.g. "5m ago").
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Offline';

    const lastSeen = new Date(timestamp);
    const now = new Date();
    const isToday = lastSeen.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = lastSeen.toDateString() === yesterday.toDateString();

    const timeStr = formatTime(timestamp);

    if (isToday) {
        return `last seen ${timeStr}`;
    }

    if (isYesterday) {
        return `last seen yesterday, ${timeStr}`;
    }

    // Older than yesterday
    const dateStr = lastSeen.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
    });
    return `last seen ${dateStr}, ${timeStr}`;
}
