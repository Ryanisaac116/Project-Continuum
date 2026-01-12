import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import presenceApi from '../api/presence';

/**
 * useTabPresence - Tab-aware presence hook
 * 
 * Behavior:
 * - ONLINE when Continuum tab is visible
 * - OFFLINE when tab hidden or app backgrounded
 * - Works on both desktop and mobile browsers
 */
export function useTabPresence() {
    const { user } = useAuth();
    const lastStatusRef = useRef(null);
    const pendingRef = useRef(false);

    const updatePresence = useCallback(async (isActive) => {
        const newStatus = isActive ? 'ONLINE' : 'OFFLINE';

        // Skip if same status already sent
        if (lastStatusRef.current === newStatus) return;

        // Skip if request in flight
        if (pendingRef.current) return;

        pendingRef.current = true;
        lastStatusRef.current = newStatus;

        try {
            if (isActive) {
                await presenceApi.markOnline();
                console.log('[Presence] Marked ONLINE');
            } else {
                await presenceApi.markOffline();
                console.log('[Presence] Marked OFFLINE');
            }
        } catch (err) {
            console.error('[Presence] Update failed:', err);
            // Reset to allow retry
            lastStatusRef.current = null;
        } finally {
            pendingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            console.log('[Presence] Visibility changed:', isVisible);
            updatePresence(isVisible);
        };

        // For mobile: pageshow/pagehide are more reliable
        const handlePageShow = () => {
            console.log('[Presence] Page shown (mobile)');
            updatePresence(true);
        };

        const handlePageHide = () => {
            console.log('[Presence] Page hidden (mobile)');
            updatePresence(false);
        };

        // Force initial update - just check if page is visible
        // Don't use document.hasFocus() as it's unreliable on mobile
        lastStatusRef.current = null;
        const isVisible = document.visibilityState === 'visible';
        console.log('[Presence] Initial visibility:', isVisible);
        updatePresence(isVisible);

        // Desktop: visibilitychange
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Mobile: pageshow/pagehide (more reliable on iOS/Android)
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [user, updatePresence]);
}

export default useTabPresence;

