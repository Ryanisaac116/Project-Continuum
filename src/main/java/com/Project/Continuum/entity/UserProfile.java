package com.Project.Continuum.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 150)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String about;

    @Column(name = "learning_goals", columnDefinition = "TEXT")
    private String learningGoals;

    @Column(name = "teaching_style", columnDefinition = "TEXT")
    private String teachingStyle;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ===== getters =====
    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getHeadline() {
        return headline;
    }

    public String getAbout() {
        return about;
    }

    public String getLearningGoals() {
        return learningGoals;
    }

    public String getTeachingStyle() {
        return teachingStyle;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    // ===== setters =====
    public void setUser(User user) {
        this.user = user;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public void setLearningGoals(String learningGoals) {
        this.learningGoals = learningGoals;
    }

    public void setTeachingStyle(String teachingStyle) {
        this.teachingStyle = teachingStyle;
    }
}
