package com.Project.Continuum.dto.chat;

import java.time.Instant;

public class ChatMessageResponse {

    private Long id;
    private Long senderId;
    private Long recipientId;
    private String content;
    private Instant sentAt;
    private Instant editedAt;
    private boolean deletedForSender;
    private boolean deletedForReceiver;
    private boolean deletedGlobally;
    private Instant deliveredAt;
    private Instant seenAt;

    // Reply info
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderName;

    // Original constructor for backward compatibility
    public ChatMessageResponse(Long id, Long senderId, Long recipientId, String content, Instant sentAt) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.content = content;
        this.sentAt = sentAt;
    }

    public ChatMessageResponse(Long id, Long senderId, Long recipientId, String content,
            Instant sentAt, Instant editedAt, boolean deletedForSender, boolean deletedForReceiver,
            boolean deletedGlobally, Instant deliveredAt, Instant seenAt,
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
        this.deliveredAt = deliveredAt;
        this.seenAt = seenAt;
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

    public Instant getSentAt() {
        return sentAt;
    }

    public Instant getEditedAt() {
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

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public Instant getSeenAt() {
        return seenAt;
    }
}
