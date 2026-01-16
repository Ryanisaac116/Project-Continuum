package com.Project.Continuum.scheduler;

import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.store.PresenceStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * PresenceScheduler - Fast detection of stale/inactive users.
 * 
 * Runs every 30 seconds and marks users OFFLINE if:
 * - They have no active WebSocket connections (connectionCount = 0)
 * - Their lastSeenAt is older than 1 minute
 * 
 * This is a safety net - WebSocket disconnect should handle most cases.
 */
@Component
public class PresenceScheduler {

    private static final Logger log = LoggerFactory.getLogger(PresenceScheduler.class);
    private static final int TIMEOUT_SECONDS = 60; // 1 minute timeout

    private final UserRepository userRepository;
    private final PresenceStore presenceStore;
    private final com.Project.Continuum.service.PresenceService presenceService;

    public PresenceScheduler(
            UserRepository userRepository,
            PresenceStore presenceStore,
            com.Project.Continuum.service.PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceStore = presenceStore;
        this.presenceService = presenceService;
    }

    /**
     * Fast check for stale users - runs every 30 seconds.
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void markInactiveUsersOffline() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(TIMEOUT_SECONDS);

        userRepository.findUsersToMarkOffline(cutoff)
                .forEach(user -> {
                    // Double-check: only mark offline if no active connections
                    int connections = presenceStore.getConnectionCount(user.getId());
                    if (connections <= 0) {
                        // Check if actually stale in the store
                        if (presenceStore.isStale(user.getId(), cutoff)) {
                            log.info("⏰ Marking user {} OFFLINE (stale for {} seconds, connections={})",
                                    user.getId(), TIMEOUT_SECONDS, connections);
                            presenceService.updatePresence(user.getId(), PresenceStatus.OFFLINE);
                        }
                    }
                });
    }
}
