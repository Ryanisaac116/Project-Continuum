package com.Project.Continuum.dto.admin;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String name,
        String role,
        boolean active,
        String presenceStatus,
        Instant createdAt,
        Instant lastSeenAt) {
}
