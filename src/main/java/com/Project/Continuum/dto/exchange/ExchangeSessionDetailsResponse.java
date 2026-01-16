package com.Project.Continuum.dto.exchange;

import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;

import java.time.LocalDateTime;

/**
 * Full session details response including participant info.
 * Used by ExchangeSession UI.
 */
public class ExchangeSessionDetailsResponse {

    private Long sessionId;
    private ExchangeIntent intent;
    private ExchangeStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    // Participant info
    private Long userAId;
    private String userAName;
    private Long userBId;
    private String userBName;

    public ExchangeSessionDetailsResponse(
            Long sessionId,
            ExchangeIntent intent,
            ExchangeStatus status,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
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

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getEndedAt() {
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
