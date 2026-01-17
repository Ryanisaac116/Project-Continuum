package com.Project.Continuum.dto.notification;

import com.Project.Continuum.entity.Notification;
import com.Project.Continuum.enums.NotificationType;
import java.time.Instant;

public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String payload;
    private boolean isRead;
    private Instant createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Notification n) {
        this.id = n.getId();
        this.type = n.getType();
        this.title = n.getTitle();
        this.message = n.getMessage();
        this.payload = n.getPayload();
        this.isRead = n.isRead();
        this.createdAt = n.getCreatedAt();
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
