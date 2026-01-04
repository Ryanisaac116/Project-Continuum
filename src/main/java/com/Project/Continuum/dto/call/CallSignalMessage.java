package com.Project.Continuum.dto.call;

import com.Project.Continuum.enums.CallSignalType;

public class CallSignalMessage {

    private CallSignalType type;
    private Long sessionId;
    private String payload; // SDP or ICE Candidate JSON
    private Long recipientId; // Explicit target (optional but good for validation)

    public CallSignalMessage() {
    }

    public CallSignalMessage(CallSignalType type, Long sessionId, String payload, Long recipientId) {
        this.type = type;
        this.sessionId = sessionId;
        this.payload = payload;
        this.recipientId = recipientId;
    }

    public CallSignalType getType() {
        return type;
    }

    public void setType(CallSignalType type) {
        this.type = type;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }
}
