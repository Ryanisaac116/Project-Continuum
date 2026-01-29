import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import presenceApi from '../api/presence';

/**
 * useTabPresence - Tab-aware presence hook
 * Calls /presence API only when visibility changes
 */
export function useTabPresence(shouldRemainOnline = false) {
    const { user, updateUserPresence } = useAuth();
    const lastStatusRef = useRef(null);
    const pendingRef = useRef(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!user?.id) return;

        // Prevent multiple mounts
        if (mountedRef.current) return;
        mountedRef.current = true;

        const updatePresence = async (isActive) => {
            // FORCE ONLINE if shouldRemainOnline is true (e.g. active call)
            const newStatus = (isActive || shouldRemainOnline) ? 'ONLINE' : 'OFFLINE';

            // Skip if same status or request pending
            if (lastStatusRef.current === newStatus || pendingRef.current) return;

            console.log('[useTabPresence] Updating presence to:', newStatus, '(Override:', shouldRemainOnline, ')');
            pendingRef.current = true;
            lastStatusRef.current = newStatus;

            try {
                if (newStatus === 'ONLINE') {
                    await presenceApi.markOnline();
                } else {
                    await presenceApi.markOffline();
                }
                console.log('[useTabPresence] API success, updating local user state...');
                updateUserPresence?.(newStatus);
            } catch (err) {
                console.error('[Presence] Failed:', err);
                lastStatusRef.current = null;
            } finally {
                pendingRef.current = false;
            }
        };

        const handleVisibility = () => {
            updatePresence(document.visibilityState === 'visible');
        };

        // Initial presence
        updatePresence(document.visibilityState === 'visible');

        // Heartbeat: Ping server every 30s to stay ONLINE while visible
        const heartbeatInterval = setInterval(() => {
            if (document.visibilityState === 'visible' || shouldRemainOnline) {
                presenceApi.heartbeat().catch(() => { });
            }
        }, 30000);

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(heartbeatInterval);
            document.removeEventListener('visibilitychange', handleVisibility);
            mountedRef.current = false;
        };
    }, [user?.id, updateUserPresence, shouldRemainOnline]); // Only run when user ID or override changes
}

export default useTabPresence;
