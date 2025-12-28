package com.Project.Continuum.dto.presence;

import com.Project.Continuum.enums.PresenceStatus;

public class PresenceResponse {

    private Long userId;
    private PresenceStatus status;

    public PresenceResponse(Long userId, PresenceStatus status) {
        this.userId = userId;
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public PresenceStatus getStatus() {
        return status;
    }
}
