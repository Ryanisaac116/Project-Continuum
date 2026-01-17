package com.Project.Continuum.entity;

import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "exchange_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "request_id" })
})
public class ExchangeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🔹 One session per request
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private SkillExchangeRequest request;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExchangeIntent intent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExchangeStatus status = ExchangeStatus.REQUESTED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.status == null) {
            this.status = ExchangeStatus.REQUESTED;
        }
    }

    // ===== GETTERS =====
    public Long getId() {
        return id;
    }

    public SkillExchangeRequest getRequest() {
        return request;
    }

    public User getUserA() {
        return userA;
    }

    public User getUserB() {
        return userB;
    }

    public ExchangeIntent getIntent() {
        return intent;
    }

    public ExchangeStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ===== SETTERS =====
    public void setRequest(SkillExchangeRequest request) {
        this.request = request;
    }

    public void setUserA(User userA) {
        this.userA = userA;
    }

    public void setUserB(User userB) {
        this.userB = userB;
    }

    public void setIntent(ExchangeIntent intent) {
        this.intent = intent;
    }

    public void setStatus(ExchangeStatus status) {
        this.status = status;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    // ===== DOMAIN HELPERS =====
    public boolean isParticipant(Long userId) {
        return userA.getId().equals(userId) || userB.getId().equals(userId);
    }
}
