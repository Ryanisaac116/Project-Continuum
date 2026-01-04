package com.Project.Continuum.scheduler;

import com.Project.Continuum.service.ExchangeSessionService;
import com.Project.Continuum.store.CallStateStore;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class CallTimeoutScheduler {

    private final CallStateStore callStateStore;
    private final ExchangeSessionService exchangeSessionService;

    // Timeout threshold: 30 seconds of inactivity
    private static final long TIMEOUT_MS = 30000;

    public CallTimeoutScheduler(CallStateStore callStateStore, ExchangeSessionService exchangeSessionService) {
        this.callStateStore = callStateStore;
        this.exchangeSessionService = exchangeSessionService;
    }

    @Scheduled(fixedRate = 10000) // Check every 10 seconds
    public void checkTimeouts() {
        Set<Long> activeSessionIds = callStateStore.getActiveSessionIds();
        long now = System.currentTimeMillis();

        for (Long sessionId : activeSessionIds) {
            Long lastHeartbeat = callStateStore.getLastHeartbeat(sessionId);
            if (lastHeartbeat != null && (now - lastHeartbeat) > TIMEOUT_MS) {
                // EXPIRE SESSION
                try {
                    exchangeSessionService.expireSession(sessionId);
                } catch (Exception e) {
                    // Log error but continue
                    System.err.println("Failed to expire session " + sessionId + ": " + e.getMessage());
                } finally {
                    // Always remove from store to prevent leak/re-check
                    callStateStore.removeSession(sessionId);
                }
            }
        }
    }
}
