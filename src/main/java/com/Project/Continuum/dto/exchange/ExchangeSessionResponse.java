package com.Project.Continuum.dto.exchange;

import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;

import java.time.LocalDateTime;

public class ExchangeSessionResponse {

    private Long sessionId;
    private ExchangeIntent intent;
    private ExchangeStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    public ExchangeSessionResponse(
            Long sessionId,
            ExchangeIntent intent,
            ExchangeStatus status,
            LocalDateTime startedAt,
            LocalDateTime endedAt
    ) {
        this.sessionId = sessionId;
        this.intent = intent;
        this.status = status;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public ExchangeIntent getIntent() {
        return intent;
    }

    public ExchangeStatus getStatus() {
        return status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }
}
