package com.Project.Continuum.dto.exchange;

import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;

import java.time.Instant;

public class ExchangeSessionResponse {

    private Long sessionId;
    private ExchangeIntent intent;
    private ExchangeStatus status;
    private Instant startedAt;
    private Instant endedAt;

    public ExchangeSessionResponse(
            Long sessionId,
            ExchangeIntent intent,
            ExchangeStatus status,
            Instant startedAt,
            Instant endedAt) {
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

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }
}
