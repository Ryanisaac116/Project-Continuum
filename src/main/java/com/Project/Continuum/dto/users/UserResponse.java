package com.Project.Continuum.dto.users;

public class UserResponse {
    private Long id;
    private String name;
    private String bio;
    private String profileImageUrl;
    private com.Project.Continuum.enums.PresenceStatus presenceStatus;
    private String role;

    public UserResponse(Long id, String name, String bio, String profileImageUrl,
            com.Project.Continuum.enums.PresenceStatus presenceStatus, String role) {
        this.id = id;
        this.name = name;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.presenceStatus = presenceStatus;
        this.role = role;
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

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public com.Project.Continuum.enums.PresenceStatus getPresenceStatus() {
        return presenceStatus;
    }

    public String getRole() {
        return role;
    }
}
