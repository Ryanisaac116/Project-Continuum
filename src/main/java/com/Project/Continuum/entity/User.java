package com.Project.Continuum.entity;

import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.enums.AuthProvider;
import jakarta.persistence.*;
import java.time.Instant;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = true)
    private AuthProvider authProvider;

    @Column(name = "provider_user_id", nullable = true)
    private String providerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "presence_status", nullable = false)
    private PresenceStatus presenceStatus = PresenceStatus.OFFLINE;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "profile_image_url", length = 2048)
    private String profileImageUrl;

    @Column(name = "session_token")
    private String sessionToken;

    // ===== getters =====
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBio() {
        return bio;
    }

    public boolean isActive() {
        return isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public PresenceStatus getPresenceStatus() {
        return presenceStatus;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public String getProviderUserId() {
        return providerUserId;
    }

    // ===== setters =====
    public void setName(String name) {
        this.name = name;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }

    public void setPresenceStatus(PresenceStatus presenceStatus) {
        this.presenceStatus = presenceStatus;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setAuthProvider(AuthProvider authProvider) {
        this.authProvider = authProvider;
    }

    public void setProviderUserId(String providerUserId) {
        this.providerUserId = providerUserId;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
