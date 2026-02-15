package com.Project.Continuum.dto.friend;

import com.Project.Continuum.enums.PresenceStatus;

public class FriendResponse {

    private Long friendUserId;
    private String name;
    private PresenceStatus presenceStatus;
    private String role;

    public FriendResponse(
            Long friendUserId,
            String name,
            PresenceStatus presenceStatus,
            String role) {
        this.friendUserId = friendUserId;
        this.name = name;
        this.presenceStatus = presenceStatus;
        this.role = role;
    }

    public Long getFriendUserId() {
        return friendUserId;
    }

    public String getName() {
        return name;
    }

    public PresenceStatus getPresenceStatus() {
        return presenceStatus;
    }

    public String getRole() {
        return role;
    }
}
