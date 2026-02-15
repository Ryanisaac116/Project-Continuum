import { useCallback, useEffect, useRef } from 'react';
import { useRealTime } from '../context/RealTimeContext';

/**
 * Re-run a refresh callback when real-time events happen, on reconnect,
 * and when the tab becomes active again.
 */
export const useLiveRefresh = ({
    refresh,
    enabled = true,
    events = ['all'],
    includeFocusSync = true,
    minIntervalMs = 1200,
    pollIntervalMs = 0,
    runOnMount = true,
}) => {
    const { eventVersion } = useRealTime();
    const lastRunAtRef = useRef(0);

    const runRefresh = useCallback((force = false) => {
        if (!enabled || typeof refresh !== 'function') return;

        const now = Date.now();
        if (!force && now - lastRunAtRef.current < minIntervalMs) return;

        lastRunAtRef.current = now;
        refresh();
    }, [enabled, refresh, minIntervalMs]);

    useEffect(() => {
        if (runOnMount) {
            runRefresh(true);
        }
    }, [runOnMount, runRefresh]);

    const eventSignature = events
        .map((eventKey) => `${eventKey}:${eventVersion?.[eventKey] ?? 0}`)
        .join('|');

    useEffect(() => {
        runRefresh();
    }, [eventSignature, runRefresh]);

    useEffect(() => {
        if (!enabled || !includeFocusSync) return;

        const syncIfVisible = () => {
            if (document.visibilityState === 'visible') {
                runRefresh();
            }
        };

        window.addEventListener('focus', syncIfVisible);
        document.addEventListener('visibilitychange', syncIfVisible);

        return () => {
            window.removeEventListener('focus', syncIfVisible);
            document.removeEventListener('visibilitychange', syncIfVisible);
        };
    }, [enabled, includeFocusSync, runRefresh]);

    useEffect(() => {
        if (!enabled || !pollIntervalMs || pollIntervalMs <= 0) return;

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                runRefresh();
            }
        }, pollIntervalMs);

        return () => window.clearInterval(timer);
    }, [enabled, pollIntervalMs, runRefresh]);

    return {
        refreshNow: () => runRefresh(true),
    };
};

export default useLiveRefresh;
