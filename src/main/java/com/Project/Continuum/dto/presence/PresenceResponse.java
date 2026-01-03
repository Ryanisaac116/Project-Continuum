package com.Project.Continuum.dto.presence;

import com.Project.Continuum.enums.PresenceStatus;

import java.time.LocalDateTime;

public class PresenceResponse {

    private Long userId;
    private PresenceStatus status;
    private LocalDateTime lastSeenAt;

    public PresenceResponse(Long userId, PresenceStatus status, LocalDateTime lastSeenAt) {
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

    public LocalDateTime getLastSeenAt() {
        return lastSeenAt;
    }
}
