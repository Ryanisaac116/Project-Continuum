package com.Project.Continuum.store;

import com.Project.Continuum.enums.PresenceStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-Memory Source of Truth for Real-Time Presence.
 * 
 * Features:
 * - Connection counting for multi-tab support
 * - Thread-safe operations via ConcurrentHashMap
 * - Automatic status transitions (ONLINE/BUSY/OFFLINE)
 * 
 * Key: Only sets OFFLINE when last WebSocket connection closes.
 */
@Component
public class PresenceStore {

    private static final Logger log = LoggerFactory.getLogger(PresenceStore.class);

    private final Map<Long, UserPresenceData> store = new ConcurrentHashMap<>();
    private final Clock clock;

    @Autowired
    public PresenceStore(Clock clock) {
        this.clock = clock;
    }

    /**
     * Increment connection count when WebSocket connects.
     * Returns the new connection count.
     */
    public int addConnection(Long userId) {
        UserPresenceData data = store.compute(userId, (id, existing) -> {
            Instant now = Instant.now(clock);
            if (existing == null) {
                return new UserPresenceData(PresenceStatus.ONLINE, now, null, 1);
            }
            existing.incrementConnections();
            existing.setLastSeenAt(now);
            // If was OFFLINE, switch to ONLINE
            if (existing.getStatus() == PresenceStatus.OFFLINE) {
                existing.setStatus(PresenceStatus.ONLINE);
            }
            return existing;
        });
        int count = data.getConnectionCount();
        return count;
    }

    /**
     * Decrement connection count when WebSocket disconnects.
     * Returns true if this was the last connection (user should go OFFLINE).
     */
    public boolean removeConnection(Long userId) {
        AtomicInteger remaining = new AtomicInteger(0);

        store.computeIfPresent(userId, (id, data) -> {
            data.decrementConnections();
            remaining.set(data.getConnectionCount());
            data.setLastSeenAt(Instant.now(clock));
            return data;
        });

        int count = remaining.get();
        return count <= 0;
    }

    /**
     * Get current connection count for a user.
     */
    public int getConnectionCount(Long userId) {
        UserPresenceData data = store.get(userId);
        return data != null ? data.getConnectionCount() : 0;
    }

    public void setUserStatus(Long userId, PresenceStatus status) {
        store.compute(userId, (id, data) -> {
            Instant now = Instant.now(clock);
            boolean hasSession = (data != null && data.getActiveSessionId() != null);

            // If reconnecting (ONLINE) but has session, stay BUSY
            if (status == PresenceStatus.ONLINE && hasSession) {
                if (data == null) {
                    return new UserPresenceData(PresenceStatus.BUSY, now, null, 0);
                }
                data.setStatus(PresenceStatus.BUSY);
                data.setLastSeenAt(now);
                return data;
            }

            if (data == null) {
                return new UserPresenceData(status, now, null, 0);
            }
            data.setStatus(status);
            data.setLastSeenAt(now);
            return data;
        });
    }

    public void setUserSession(Long userId, Long sessionId) {
        store.compute(userId, (id, data) -> {
            if (data == null) {
                return new UserPresenceData(PresenceStatus.BUSY, Instant.now(clock), sessionId, 0);
            }
            data.setActiveSessionId(sessionId);
            return data;
        });
    }

    public void updateLastSeen(Long userId) {
        store.computeIfPresent(userId, (id, data) -> {
            data.setLastSeenAt(Instant.now(clock));
            return data;
        });
    }

    public PresenceStatus getStatus(Long userId) {
        UserPresenceData data = store.get(userId);
        return data != null ? data.getStatus() : PresenceStatus.OFFLINE;
    }

    public Instant getLastSeen(Long userId) {
        UserPresenceData data = store.get(userId);
        return data != null ? data.getLastSeenAt() : null;
    }

    public void removeUser(Long userId) {
        store.remove(userId);
    }

    /**
     * Check if a user is stale (no recent activity).
     */
    public boolean isStale(Long userId, Instant cutoff) {
        UserPresenceData data = store.get(userId);
        if (data == null)
            return true;
        Instant lastSeen = data.getLastSeenAt();
        return lastSeen == null || lastSeen.isBefore(cutoff);
    }

    /**
     * Count all users currently online (not OFFLINE).
     * Used for dashboard metrics.
     */
    public long getOnlineUserCount() {
        return store.values().stream()
                .filter(d -> d.getStatus() != PresenceStatus.OFFLINE && d.getConnectionCount() > 0)
                .count();
    }

    // Internal Data Class
    private static class UserPresenceData {
        private PresenceStatus status;
        private Instant lastSeenAt;
        private Long activeSessionId;
        private int connectionCount;

        public UserPresenceData(PresenceStatus status, Instant lastSeenAt, Long activeSessionId,
                int connectionCount) {
            this.status = status;
            this.lastSeenAt = lastSeenAt;
            this.activeSessionId = activeSessionId;
            this.connectionCount = connectionCount;
        }

        public PresenceStatus getStatus() {
            return status;
        }

        public void setStatus(PresenceStatus status) {
            this.status = status;
        }

        public Instant getLastSeenAt() {
            return lastSeenAt;
        }

        public void setLastSeenAt(Instant lastSeenAt) {
            this.lastSeenAt = lastSeenAt;
        }

        public Long getActiveSessionId() {
            return activeSessionId;
        }

        public void setActiveSessionId(Long activeSessionId) {
            this.activeSessionId = activeSessionId;
        }

        public int getConnectionCount() {
            return connectionCount;
        }

        public void incrementConnections() {
            this.connectionCount++;
        }

        public void decrementConnections() {
            if (this.connectionCount > 0) {
                this.connectionCount--;
            }
        }
    }
}
