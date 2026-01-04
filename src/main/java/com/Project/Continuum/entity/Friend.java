package com.Project.Continuum.entity;

import com.Project.Continuum.enums.FriendSource;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "friends", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user1_id", "user2_id" })
})
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user1_id")
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user2_id")
    private User user2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private com.Project.Continuum.enums.FriendStatus status = com.Project.Continuum.enums.FriendStatus.PENDING;

    @Column(name = "connected_at", nullable = false, updatable = false)
    private LocalDateTime connectedAt;

    @PrePersist
    protected void onCreate() {
        connectedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser1() {
        return user1;
    }

    public User getUser2() {
        return user2;
    }

    public User getRequester() {
        return requester;
    }

    public FriendSource getSource() {
        return source;
    }

    public com.Project.Continuum.enums.FriendStatus getStatus() {
        return status;
    }

    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }

    public void setUser1(User user1) {
        this.user1 = user1;
    }

    public void setUser2(User user2) {
        this.user2 = user2;
    }

    public void setRequester(User requester) {
        this.requester = requester;
    }

    public void setSource(FriendSource source) {
        this.source = source;
    }

    public void setStatus(com.Project.Continuum.enums.FriendStatus status) {
        this.status = status;
    }
}
