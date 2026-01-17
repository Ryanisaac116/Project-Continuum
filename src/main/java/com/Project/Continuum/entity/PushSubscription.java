package com.Project.Continuum.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * PushSubscription - Stores web push subscription info for a user.
 * 
 * Each user can have multiple subscriptions (multiple browsers/devices).
 * The endpoint is unique per subscription.
 */
@Entity
@Table(name = "push_subscriptions", uniqueConstraints = @UniqueConstraint(columnNames = "endpoint"))
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * The push service endpoint URL (unique per subscription)
     */
    @Column(name = "endpoint", nullable = false, length = 500)
    private String endpoint;

    /**
     * Public key for encryption (p256dh)
     */
    @Column(name = "p256dh", nullable = false, length = 255)
    private String p256dh;

    /**
     * Authentication secret
     */
    @Column(name = "auth", nullable = false, length = 255)
    private String auth;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // ==================== GETTERS ====================

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public String getAuth() {
        return auth;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    // ==================== SETTERS ====================

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public void setP256dh(String p256dh) {
        this.p256dh = p256dh;
    }

    public void setAuth(String auth) {
        this.auth = auth;
    }

    public void setLastUsedAt(Instant lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }
}
