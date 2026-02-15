package com.Project.Continuum.dto.admin;

import java.time.Instant;
import java.util.List;

public record UserActivityResponse(
                Instant accountCreated,
                Instant lastLogin,
                long messagesSent,
                long friendsCount,
                long teachingSkills,
                long learningSkills,
                long sessionsCompleted,
                List<ActivityItem> recentActivity) {
        public record ActivityItem(
                        String type,
                        String description,
                        Instant timestamp) {
        }
}
