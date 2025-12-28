package com.Project.Continuum.dto.presence;

import com.Project.Continuum.enums.PresenceStatus;
import jakarta.validation.constraints.NotNull;


public class PresenceUpdateRequest {

    @NotNull
    private PresenceStatus status;

    public PresenceStatus getStatus() {
        return status;
    }

    public void setStatus(PresenceStatus status) {
        this.status = status;
    }
}
