package com.Project.Continuum.store;

import com.Project.Continuum.enums.PresenceStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-Memory Source of Truth for Real-Time Presence.
 * <p>
 * This store handles ephemeral status (ONLINE/BUSY).
 * It delegates persistence of "Last Seen" to the database via PresenceService.
 * <p>
 * Concurrency:
 * Uses ConcurrentHashMap. atomic compute() operations ensure thread safety
 * when transitioning states (e.g. ONLINE -> BUSY during session start).
 */
@Component
public class PresenceStore {

    private final Map<Long, UserPresenceData> store = new ConcurrentHashMap<>();

    public void setUserStatus(Long userId, PresenceStatus status) {
        store.compute(userId, (id, data) -> {
            boolean hasSession = (data != null && data.getActiveSessionId() != null);

            // If reconnecting (ONLINE) but has session, stay BUSY
            if (status == PresenceStatus.ONLINE && hasSession) {
                if (data == null) { // Should not happen if hasSession is true, but logically
                    return new UserPresenceData(PresenceStatus.BUSY, LocalDateTime.now(), null);
                }
                data.setStatus(PresenceStatus.BUSY);
                data.setLastSeenAt(LocalDateTime.now());
                return data;
            }

            if (data == null) {
                return new UserPresenceData(status, LocalDateTime.now(), null);
            }
            data.setStatus(status);
            data.setLastSeenAt(LocalDateTime.now());
            return data;
        });
    }

    public void setUserSession(Long userId, Long sessionId) {
        store.compute(userId, (id, data) -> {
            if (data == null) {
                return new UserPresenceData(PresenceStatus.BUSY, LocalDateTime.now(), sessionId);
            }
            data.setActiveSessionId(sessionId);
            return data;
        });
    }

    public void updateLastSeen(Long userId) {
        store.computeIfPresent(userId, (id, data) -> {
            data.setLastSeenAt(LocalDateTime.now());
            return data;
        });
    }

    public PresenceStatus getStatus(Long userId) {
        UserPresenceData data = store.get(userId);
        return data != null ? data.getStatus() : PresenceStatus.OFFLINE;
    }

    public LocalDateTime getLastSeen(Long userId) {
        UserPresenceData data = store.get(userId);
        return data != null ? data.getLastSeenAt() : null;
    }

    public void removeUser(Long userId) {
        store.remove(userId);
    }

    // Internal Data Class
    private static class UserPresenceData {
        private PresenceStatus status;
        private LocalDateTime lastSeenAt;
        private Long activeSessionId;

        public UserPresenceData(PresenceStatus status, LocalDateTime lastSeenAt, Long activeSessionId) {
            this.status = status;
            this.lastSeenAt = lastSeenAt;
            this.activeSessionId = activeSessionId;
        }

        public PresenceStatus getStatus() {
            return status;
        }

        public void setStatus(PresenceStatus status) {
            this.status = status;
        }

        public LocalDateTime getLastSeenAt() {
            return lastSeenAt;
        }

        public void setLastSeenAt(LocalDateTime lastSeenAt) {
            this.lastSeenAt = lastSeenAt;
        }

        public Long getActiveSessionId() {
            return activeSessionId;
        }

        public void setActiveSessionId(Long activeSessionId) {
            this.activeSessionId = activeSessionId;
        }
    }
}
