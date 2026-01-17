package com.Project.Continuum.entity;

import com.Project.Continuum.enums.ExchangeRequestStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "skill_exchange_requests", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "sender_id",
                "receiver_id",
                "sender_user_skill_id",
                "receiver_user_skill_id"
        })
})
public class SkillExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_user_skill_id")
    private UserSkill senderSkill;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_user_skill_id")
    private UserSkill receiverSkill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExchangeRequestStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.status == null) {
            this.status = ExchangeRequestStatus.PENDING;
        }
    }

    // ===== getters =====
    public Long getId() {
        return id;
    }

    public User getSender() {
        return sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public UserSkill getSenderSkill() {
        return senderSkill;
    }

    public UserSkill getReceiverSkill() {
        return receiverSkill;
    }

    public ExchangeRequestStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ===== setters =====
    public void setSender(User sender) {
        this.sender = sender;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public void setSenderSkill(UserSkill senderSkill) {
        this.senderSkill = senderSkill;
    }

    public void setReceiverSkill(UserSkill receiverSkill) {
        this.receiverSkill = receiverSkill;
    }

    public void setStatus(ExchangeRequestStatus status) {
        this.status = status;
    }
}
