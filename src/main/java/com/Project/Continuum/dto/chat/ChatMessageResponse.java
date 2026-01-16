package com.Project.Continuum.dto.chat;

import java.time.LocalDateTime;

public class ChatMessageResponse {

    private Long id;
    private Long senderId;
    private Long recipientId;
    private String content;
    private LocalDateTime sentAt;
    private LocalDateTime editedAt;
    private boolean deletedForSender;
    private boolean deletedForReceiver;
    private boolean deletedGlobally;

    // Reply info
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderName;

    // Original constructor for backward compatibility
    public ChatMessageResponse(Long id, Long senderId, Long recipientId, String content, LocalDateTime sentAt) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.sentAt = sentAt;
    }

    // Full constructor with all fields
    public ChatMessageResponse(Long id, Long senderId, Long recipientId, String content,
            LocalDateTime sentAt, LocalDateTime editedAt, boolean deletedForSender, boolean deletedForReceiver,
            boolean deletedGlobally,
            Long replyToId, String replyToContent, String replyToSenderName) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.sentAt = sentAt;
        this.editedAt = editedAt;
        this.deletedForSender = deletedForSender;
        this.deletedForReceiver = deletedForReceiver;
        this.deletedGlobally = deletedGlobally;
        this.replyToId = replyToId;
        this.replyToContent = replyToContent;
        this.replyToSenderName = replyToSenderName;
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

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public boolean isDeletedForSender() {
        return deletedForSender;
    }

    public boolean isDeletedForReceiver() {
        return deletedForReceiver;
    }

    public boolean isDeletedGlobally() {
        return deletedGlobally;
    }

    public Long getReplyToId() {
        return replyToId;
    }

    public String getReplyToContent() {
        return replyToContent;
    }

    public String getReplyToSenderName() {
        return replyToSenderName;
    }
}
