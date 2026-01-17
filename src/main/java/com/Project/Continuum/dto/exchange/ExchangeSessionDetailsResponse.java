package com.Project.Continuum.dto.exchange;

import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;

import java.time.Instant;

/**
 * Full session details response including participant info.
 * Used by ExchangeSession UI.
 */
public class ExchangeSessionDetailsResponse {

    private Long sessionId;
    private ExchangeIntent intent;
    private ExchangeStatus status;
    private Instant startedAt;
    private Instant endedAt;

    // Participant info
    private Long userAId;
    private String userAName;
    private Long userBId;
    private String userBName;

    public ExchangeSessionDetailsResponse(
            Long sessionId,
            ExchangeIntent intent,
            ExchangeStatus status,
            Instant startedAt,
            Instant endedAt,
            Long userAId,
            String userAName,
            Long userBId,
            String userBName) {
        this.sessionId = sessionId;
        this.intent = intent;
        this.status = status;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.userAId = userAId;
        this.userAName = userAName;
        this.userBId = userBId;
        this.userBName = userBName;
    }

    // Getters
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

    public Long getUserAId() {
        return userAId;
    }

    public String getUserAName() {
        return userAName;
    }

    public Long getUserBId() {
        return userBId;
    }

    public String getUserBName() {
        return userBName;
    }
}
