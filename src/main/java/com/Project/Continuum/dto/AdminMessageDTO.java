package com.Project.Continuum.dto;

import com.Project.Continuum.enums.AdminMessageStatus;
import com.Project.Continuum.enums.AdminMessageType;
import java.time.Instant;

public record AdminMessageDTO(
        Long id,
        SenderDTO sender,
        AdminMessageType type,
        String subject,
        String message,
        String relatedEntityType,
        Long relatedEntityId,
        AdminMessageStatus status,
        Instant createdAt) {
    public record SenderDTO(
            Long id,
            String name,
            String profileImageUrl) {
    }
}
