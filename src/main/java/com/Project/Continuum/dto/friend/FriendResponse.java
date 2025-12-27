package com.Project.Continuum.dto.friend;

public class FriendResponse {

    private Long friendUserId;
    private String name;
    private String source;

    public FriendResponse(Long friendUserId, String name, String source) {
        this.friendUserId = friendUserId;
        this.name = name;
        this.source = source;
    }

    public Long getFriendUserId() { return friendUserId; }
    public String getName() { return name; }
    public String getSource() { return source; }
}
