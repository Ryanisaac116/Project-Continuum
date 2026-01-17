package com.Project.Continuum.scheduler;

import com.Project.Continuum.entity.CallSession;
import com.Project.Continuum.enums.CallEndReason;
import com.Project.Continuum.enums.CallStatus;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.repository.CallSessionRepository;
import com.Project.Continuum.service.ExchangeSessionService;
import com.Project.Continuum.service.NotificationService;
import com.Project.Continuum.store.CallStateStore;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * CallTimeoutScheduler - Handles call cleanup and timeouts:
 * 
 * 1. STARTUP CLEANUP: End all active calls on server restart
 * 2. RINGING TIMEOUT: Auto-expire calls not answered within 30 seconds
 * 3. ACCEPTED TIMEOUT: Auto-expire connected calls after 5 minutes without
 * activity
 * 4. STALE DETECTION: Clean up any orphaned calls
 */
@Component
public class CallTimeoutScheduler {

    private static final Logger log = LoggerFactory.getLogger(CallTimeoutScheduler.class);

    // Timeout configurations
    private static final int RINGING_TIMEOUT_SECONDS = 30;
    private static final int ACCEPTED_TIMEOUT_MINUTES = 5; // Max call duration without heartbeat
    private static final int STALE_CALL_HOURS = 1; // Any call older than 1 hour is stale
    private static final long EXCHANGE_TIMEOUT_MS = 30000;

    private final CallSessionRepository callSessionRepository;
    private final CallStateStore callStateStore;
    private final ExchangeSessionService exchangeSessionService;
    private final NotificationService notificationService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final Clock clock;

    public CallTimeoutScheduler(
            CallSessionRepository callSessionRepository,
            CallStateStore callStateStore,
            ExchangeSessionService exchangeSessionService,
            NotificationService notificationService,
            SimpMessageSendingOperations messagingTemplate,
            Clock clock) {
        this.callSessionRepository = callSessionRepository;
        this.callStateStore = callStateStore;
        this.exchangeSessionService = exchangeSessionService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
        this.clock = clock;
    }

    // ==================== STARTUP CLEANUP ====================

    /**
     * On server startup, clean up any stuck calls from previous session.
     * This handles server crashes, restarts, or deployments.
     */
    @PostConstruct
    @Transactional
    public void cleanupStuckCallsOnStartup() {
        log.info("🧹 Server starting - cleaning up stuck call sessions...");

        List<CallSession> activeCalls = callSessionRepository.findAll().stream()
                .filter(c -> c.getStatus() == CallStatus.RINGING || c.getStatus() == CallStatus.ACCEPTED)
                .toList();

        int cleaned = 0;
        for (CallSession call : activeCalls) {
            try {
                endStaleCall(call, CallEndReason.STALE_TIMEOUT, "Server restart");
                cleaned++;
            } catch (Exception e) {
                log.error("Failed to clean up call {}: {}", call.getId(), e.getMessage());
            }
        }

        log.info("🧹 Startup cleanup complete: {} stuck calls cleared", cleaned);
    }

    // ==================== RINGING CALL TIMEOUT ====================

    /**
     * Expires RINGING calls that haven't been answered within 30 seconds.
     * Creates missed call notification for caller.
     */
    @Scheduled(fixedRate = 5000) // Every 5 seconds
    @Transactional
    public void expireRingingCalls() {
        Instant cutoff = Instant.now(clock).minus(RINGING_TIMEOUT_SECONDS, ChronoUnit.SECONDS);

        List<CallSession> timedOutCalls = callSessionRepository.findAll().stream()
                .filter(c -> c.getStatus() == CallStatus.RINGING)
                .filter(c -> c.getInitiatedAt().isBefore(cutoff))
                .toList();

        for (CallSession call : timedOutCalls) {
            expireRingingCall(call);
        }
    }

    private void expireRingingCall(CallSession call) {
        log.info("⏰ Expiring timed out RINGING call: callId={}", call.getId());

        call.setStatus(CallStatus.ENDED);
        call.setEndedAt(Instant.now(clock));
        call.setEndReason(CallEndReason.TIMEOUT);
        callSessionRepository.save(call);

        // Notify both parties
        broadcastCallEnd(call, "TIMEOUT");

        // Create missed call notification for caller
        notificationService.createNotification(
                call.getCaller().getId(),
                NotificationType.CALL_MISSED,
                "Missed call",
                call.getReceiver().getName() + " didn't answer",
                "{\"receiverId\":" + call.getReceiver().getId() + ",\"callId\":" + call.getId() + "}");
    }

    // ==================== ACCEPTED CALL TIMEOUT ====================

    /**
     * Expires ACCEPTED calls that have been connected for too long.
     * This catches calls where both parties have disconnected but
     * the end signal was never received (network issues, browser crashes, etc.)
     * 
     * A properly functioning call will have ended before this timeout.
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    @Transactional
    public void expireStaleAcceptedCalls() {
        Instant cutoff = Instant.now(clock).minus(ACCEPTED_TIMEOUT_MINUTES, ChronoUnit.MINUTES);

        List<CallSession> staleCalls = callSessionRepository.findAll().stream()
                .filter(c -> c.getStatus() == CallStatus.ACCEPTED)
                .filter(c -> {
                    // Check if accepted too long ago
                    Instant acceptedAt = c.getAcceptedAt();
                    return acceptedAt != null && acceptedAt.isBefore(cutoff);
                })
                .toList();

        for (CallSession call : staleCalls) {
            log.info("⏰ Expiring stale ACCEPTED call: callId={}, acceptedAt={}",
                    call.getId(), call.getAcceptedAt());
            endStaleCall(call, CallEndReason.STALE_TIMEOUT, "Connection timeout");
        }
    }

    // ==================== FORCE CLEAR ANCIENT CALLS ====================

    /**
     * Force-clear any calls that are impossibly old (over 1 hour).
     * This is a safety net for any edge cases that slip through.
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void forceCleanAncientCalls() {
        Instant cutoff = Instant.now(clock).minus(STALE_CALL_HOURS, ChronoUnit.HOURS);

        List<CallSession> ancientCalls = callSessionRepository.findAll().stream()
                .filter(c -> c.getStatus() == CallStatus.RINGING || c.getStatus() == CallStatus.ACCEPTED)
                .filter(c -> c.getInitiatedAt().isBefore(cutoff))
                .toList();

        for (CallSession call : ancientCalls) {
            log.warn("🚨 Force-clearing ancient call: callId={}, initiatedAt={}",
                    call.getId(), call.getInitiatedAt());
            endStaleCall(call, CallEndReason.FORCE_CLEARED, "Force cleared - ancient call");
        }
    }

    // ==================== SHARED CLEANUP ====================

    private void endStaleCall(CallSession call, CallEndReason reason, String logReason) {
        call.setStatus(CallStatus.ENDED);
        call.setEndedAt(Instant.now(clock));
        call.setEndReason(reason);
        callSessionRepository.save(call);

        broadcastCallEnd(call, reason.name());
        log.info("Call {} ended: {} - {}", call.getId(), reason, logReason);
    }

    private void broadcastCallEnd(CallSession call, String endReason) {
        Map<String, Object> payload = Map.of(
                "event", "CALL_END",
                "callId", call.getId(),
                "endReason", endReason);

        try {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(call.getCaller().getId()),
                    "/queue/calls",
                    payload);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(call.getReceiver().getId()),
                    "/queue/calls",
                    payload);
        } catch (Exception e) {
            // User might be disconnected - that's expected for stale calls
            log.debug("Could not send call end to users (expected for stale calls): {}", e.getMessage());
        }
    }

    // ==================== EXCHANGE SESSION TIMEOUT ====================

    /**
     * Checks exchange sessions with stale heartbeats.
     */
    @Scheduled(fixedRate = 10000) // Every 10 seconds
    public void checkExchangeTimeouts() {
        Set<Long> activeSessionIds = callStateStore.getActiveSessionIds();
        long now = System.currentTimeMillis();

        for (Long sessionId : activeSessionIds) {
            Long lastHeartbeat = callStateStore.getLastHeartbeat(sessionId);
            if (lastHeartbeat != null && (now - lastHeartbeat) > EXCHANGE_TIMEOUT_MS) {
                try {
                    exchangeSessionService.expireSession(sessionId);
                } catch (Exception e) {
                    log.error("Failed to expire exchange session {}: {}", sessionId, e.getMessage());
                } finally {
                    callStateStore.removeSession(sessionId);
                }
            }
        }
    }
}
