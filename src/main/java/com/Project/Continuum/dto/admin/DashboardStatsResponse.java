package com.Project.Continuum.dto.admin;

public record DashboardStatsResponse(
                long totalUsers,
                long activeUsers,
                long totalExchangeRequests,
                long totalMessages,
                long completedSessions,
                long teachingSkills,
                long learningSkills) {
}
