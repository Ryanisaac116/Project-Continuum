package com.Project.Continuum.dto.presence;

import com.Project.Continuum.enums.PresenceStatus;

import java.time.Instant;

public class PresenceResponse {

    private Long userId;
    private PresenceStatus status;
    private Instant lastSeenAt;

    public PresenceResponse(Long userId, PresenceStatus status, Instant lastSeenAt) {
        this.userId = userId;
        this.status = status;
        this.lastSeenAt = lastSeenAt;
    }

    public Long getUserId() {
        return userId;
    }

    public PresenceStatus getStatus() {
        return status;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }
}
