package com.Project.Continuum.dto.friend;

import com.Project.Continuum.enums.PresenceStatus;
import java.time.LocalDateTime;

/**
 * DTO for pending incoming friend requests
 */
public class FriendRequestResponse {
    private Long requesterId;
    private String requesterName;
    private PresenceStatus presence;
    private LocalDateTime requestedAt;

    public FriendRequestResponse(Long requesterId, String requesterName, PresenceStatus presence,
            LocalDateTime requestedAt) {
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.presence = presence;
        this.requestedAt = requestedAt;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public PresenceStatus getPresence() {
        return presence;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }
}
