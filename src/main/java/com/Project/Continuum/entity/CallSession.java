package com.Project.Continuum.entity;

import com.Project.Continuum.enums.CallStatus;
import com.Project.Continuum.enums.CallEndReason;
import com.Project.Continuum.enums.CallType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "call_sessions")
public class CallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private CallStatus status;

    /**
     * Call type: FRIEND (anytime between friends) or EXCHANGE (within active
     * exchange)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", nullable = false, length = 20)
    private CallType callType;

    /**
     * Link to exchange session. NULL for FRIEND calls, REQUIRED for EXCHANGE calls.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_session_id")
    private ExchangeSession exchangeSession;

    /**
     * Whether screen sharing is currently active in this call.
     */
    @Column(name = "screen_share_active", nullable = false)
    private boolean screenShareActive = false;

    @Column(name = "initiated_at", nullable = false)
    private Instant initiatedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "end_reason")
    private CallEndReason endReason;

    public CallSession() {
    }

    // ==================== GETTERS ====================

    public Long getId() {
        return id;
    }

    public User getCaller() {
        return caller;
    }

    public User getReceiver() {
        return receiver;
    }

    public CallStatus getStatus() {
        return status;
    }

    public CallType getCallType() {
        return callType;
    }

    public ExchangeSession getExchangeSession() {
        return exchangeSession;
    }

    public boolean isScreenShareActive() {
        return screenShareActive;
    }

    public Instant getInitiatedAt() {
        return initiatedAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public CallEndReason getEndReason() {
        return endReason;
    }

    // ==================== SETTERS ====================

    public void setId(Long id) {
        this.id = id;
    }

    public void setCaller(User caller) {
        this.caller = caller;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public void setStatus(CallStatus status) {
        this.status = status;
    }

    public void setCallType(CallType callType) {
        this.callType = callType;
    }

    public void setExchangeSession(ExchangeSession exchangeSession) {
        this.exchangeSession = exchangeSession;
    }

    public void setScreenShareActive(boolean screenShareActive) {
        this.screenShareActive = screenShareActive;
    }

    public void setInitiatedAt(Instant initiatedAt) {
        this.initiatedAt = initiatedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public void setEndReason(CallEndReason endReason) {
        this.endReason = endReason;
    }

    // ==================== DOMAIN HELPERS ====================

    /**
     * Check if user is a participant in this call
     */
    public boolean isParticipant(Long userId) {
        return caller.getId().equals(userId) || receiver.getId().equals(userId);
    }

    /**
     * Check if call is currently active (RINGING or ACCEPTED)
     */
    public boolean isActive() {
        return status == CallStatus.RINGING || status == CallStatus.ACCEPTED;
    }
}
