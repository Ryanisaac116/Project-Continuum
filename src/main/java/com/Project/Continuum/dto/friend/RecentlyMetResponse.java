package com.Project.Continuum.dto.friend;

import com.Project.Continuum.enums.PresenceStatus;
import java.time.LocalDateTime;

/**
 * DTO for recently met users from completed exchange sessions
 */
public class RecentlyMetResponse {
    private Long userId;
    private String name;
    private PresenceStatus presence;
    private LocalDateTime lastSessionAt;

    public RecentlyMetResponse(Long userId, String name, PresenceStatus presence, LocalDateTime lastSessionAt) {
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

    public LocalDateTime getLastSessionAt() {
        return lastSessionAt;
    }
}
