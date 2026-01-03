package com.Project.Continuum.dto.chat;

import java.time.LocalDateTime;

public class ChatMessageResponse {

    private Long id;
    private Long senderId;
    private Long recipientId;
    private String content;
    private LocalDateTime sentAt;

    public ChatMessageResponse(Long id, Long senderId, Long recipientId, String content, LocalDateTime sentAt) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.sentAt = sentAt;
    }

    public Long getId() {
        return id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }
}
