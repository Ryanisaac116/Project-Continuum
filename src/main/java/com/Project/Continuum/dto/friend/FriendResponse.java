package com.Project.Continuum.dto.friend;

import com.Project.Continuum.enums.PresenceStatus;

public class FriendResponse {

    private Long friendUserId;
    private String name;
    private PresenceStatus presenceStatus;

    public FriendResponse(
            Long friendUserId,
            String name,
            PresenceStatus presenceStatus
    ) {
        this.friendUserId = friendUserId;
        this.name = name;
        this.presenceStatus = presenceStatus;
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
}
