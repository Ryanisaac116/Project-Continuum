package com.Project.Continuum.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "seen_at")
    private Instant seenAt;

    @Column(name = "is_deleted_for_sender", nullable = false)
    private boolean deletedForSender = false;

    @Column(name = "is_deleted_for_receiver", nullable = false)
    private boolean deletedForReceiver = false;

    @Column(name = "is_deleted_globally", nullable = false)
    private boolean deletedGlobally = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_message_id")
    private ChatMessage replyTo;

    public ChatMessage() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(Instant editedAt) {
        this.editedAt = editedAt;
    }

    public boolean isDeletedForSender() {
        return deletedForSender;
    }

    public void setDeletedForSender(boolean deletedForSender) {
        this.deletedForSender = deletedForSender;
    }

    public boolean isDeletedForReceiver() {
        return deletedForReceiver;
    }

    public void setDeletedForReceiver(boolean deletedForReceiver) {
        this.deletedForReceiver = deletedForReceiver;
    }

    public ChatMessage getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(ChatMessage replyTo) {
        this.replyTo = replyTo;
    }

    public boolean isDeletedGlobally() {
        return deletedGlobally;
    }

    public void setDeletedGlobally(boolean deletedGlobally) {
        this.deletedGlobally = deletedGlobally;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public Instant getSeenAt() {
        return seenAt;
    }

    public void setSeenAt(Instant seenAt) {
        this.seenAt = seenAt;
    }
}
