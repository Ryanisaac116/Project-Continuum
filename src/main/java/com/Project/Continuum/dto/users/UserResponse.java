package com.Project.Continuum.dto.users;

public class UserResponse {
    private Long id;
    private String name;
    private String bio;
    private com.Project.Continuum.enums.PresenceStatus presenceStatus;

    public UserResponse(Long id, String name, String bio, com.Project.Continuum.enums.PresenceStatus presenceStatus) {
        this.id = id;
        this.name = name;
        this.bio = bio;
        this.presenceStatus = presenceStatus;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBio() {
        return bio;
    }

    public com.Project.Continuum.enums.PresenceStatus getPresenceStatus() {
        return presenceStatus;
    }
}
