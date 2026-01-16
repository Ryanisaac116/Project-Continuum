package com.Project.Continuum.controller;

import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.store.PresenceStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * ExchangeStatsController - Dashboard stats endpoint.
 * 
 * Returns:
 * - myCompleted: User's completed exchanges (0 if not authenticated)
 * - activeExchanges: Platform-wide active exchanges
 * - onlineUsers: Platform-wide online user count
 */
@RestController
@RequestMapping("/api/exchange-stats")
public class ExchangeStatsController {

    private final ExchangeSessionRepository exchangeSessionRepository;
    private final PresenceStore presenceStore;

    public ExchangeStatsController(
            ExchangeSessionRepository exchangeSessionRepository,
            PresenceStore presenceStore) {
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.presenceStore = presenceStore;
    }

    @GetMapping
    public ResponseEntity<Map<String, Long>> getStats() {
        Long userId = getCurrentUserIdOrNull();

        // User's completed sessions (0 if not authenticated)
        long myCompleted = 0;
        if (userId != null) {
            myCompleted = exchangeSessionRepository.countByUserIdAndStatus(userId, ExchangeStatus.COMPLETED);
        }

        // Platform-wide active sessions
        long activeExchanges = exchangeSessionRepository.countByStatus(ExchangeStatus.ACTIVE);

        // Platform-wide online users
        long onlineUsers = presenceStore.getOnlineUserCount();

        return ResponseEntity.ok(Map.of(
                "myCompleted", myCompleted,
                "activeExchanges", activeExchanges,
                "onlineUsers", onlineUsers));
    }

    private Long getCurrentUserIdOrNull() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
