package com.Project.Continuum.dto.users;

public class UserResponse {
    private Long id;
    private String name;
    private String bio;
    private String profileImageUrl;
    private com.Project.Continuum.enums.PresenceStatus presenceStatus;
    private String role;
    private java.time.Instant lastSeenAt;

    public UserResponse(Long id, String name, String bio, String profileImageUrl,
            com.Project.Continuum.enums.PresenceStatus presenceStatus, String role, java.time.Instant lastSeenAt) {
        this.id = id;
        this.name = name;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.presenceStatus = presenceStatus;
        this.role = role;
        this.lastSeenAt = lastSeenAt;
    }

    public UserResponse(Long id, String name, String bio, String profileImageUrl,
            com.Project.Continuum.enums.PresenceStatus presenceStatus, String role) {
        this(id, name, bio, profileImageUrl, presenceStatus, role, null);
    }

    public Long getId() {
        return id;
    }

    // ... getters

    public java.time.Instant getLastSeenAt() {
        return lastSeenAt;
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
