package com.Project.Continuum.dto.friend;

import com.Project.Continuum.enums.PresenceStatus;
import java.time.Instant;

/**
 * DTO for recently met users from completed exchange sessions
 */
public class RecentlyMetResponse {
    private Long userId;
    private String name;
    private PresenceStatus presence;
    private Instant lastSessionAt;

    public RecentlyMetResponse(Long userId, String name, PresenceStatus presence, Instant lastSessionAt) {
        this.userId = userId;
        this.name = name;
        this.presence = presence;
        this.lastSessionAt = lastSessionAt;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public PresenceStatus getPresence() {
        return presence;
    }

    public Instant getLastSessionAt() {
        return lastSessionAt;
    }
}
