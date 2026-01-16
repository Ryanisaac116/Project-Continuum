package com.Project.Continuum.controller;

import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.MatchDecisionType;
import com.Project.Continuum.enums.MatchIntent;
import com.Project.Continuum.matching.MatchCandidate;
import com.Project.Continuum.matching.MatchDecision;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.service.CallService;
import com.Project.Continuum.service.MatchingService;
import com.Project.Continuum.service.ExchangeSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket controller for real-time matching
 */
@Controller
public class MatchingWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(MatchingWebSocketController.class);

    private final MatchingService matchingService;
    private final ExchangeSessionService exchangeSessionService;
    private final CallService callService;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;

    private final ConcurrentHashMap<Long, MatchIntent> waitingQueue = new ConcurrentHashMap<>();

    public MatchingWebSocketController(
            MatchingService matchingService,
            ExchangeSessionService exchangeSessionService,
            CallService callService,
            UserRepository userRepository,
            SimpMessageSendingOperations messagingTemplate) {
        this.matchingService = matchingService;
        this.exchangeSessionService = exchangeSessionService;
        this.callService = callService;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/matching.join")
    public void joinMatching(String intentString, Principal principal) {
        if (principal == null) {
            log.warn("No principal for matching.join");
            return;
        }

        Long userId;
        try {
            userId = Long.valueOf(principal.getName());
        } catch (NumberFormatException e) {
            log.warn("Invalid user ID in principal: {}", principal.getName());
            return;
        }

        MatchIntent intent;
        try {
            String cleanIntent = intentString.replace("\"", "").trim();
            intent = MatchIntent.valueOf(cleanIntent);
        } catch (Exception e) {
            log.warn("Invalid intent: {}, defaulting to AUDIO_CALL", intentString);
            intent = MatchIntent.AUDIO_CALL;
        }

        log.info("User {} joining matching with intent: {}", userId, intent);

        // First, check if there's someone in the waiting queue
        Long matchedUserId = findFromWaitingQueue(userId);

        if (matchedUserId != null) {
            log.info("Found match from queue: {} <-> {}", userId, matchedUserId);
            createSessionAndNotify(userId, matchedUserId);
            return;
        }

        // Try to find candidates using MatchingService
        MatchDecision decision = matchingService.findMatch(userId, intent);

        if (decision.getType() == MatchDecisionType.ONLINE_CANDIDATE_FOUND &&
                !decision.getCandidates().isEmpty()) {

            for (MatchCandidate candidate : decision.getCandidates()) {
                if (waitingQueue.containsKey(candidate.getUserId())) {
                    log.info("Matched with waiting candidate: {} <-> {}", userId, candidate.getUserId());
                    waitingQueue.remove(candidate.getUserId());
                    createSessionAndNotify(userId, candidate.getUserId());
                    return;
                }
            }
        }

        // No immediate match - add to waiting queue
        waitingQueue.put(userId, intent);
        log.info("User {} added to waiting queue. Queue size: {}", userId, waitingQueue.size());

        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/match",
                Map.of("type", "WAITING", "message", "You are in the queue. Waiting for a partner..."));
    }

    private Long findFromWaitingQueue(Long userId) {
        for (Map.Entry<Long, MatchIntent> entry : waitingQueue.entrySet()) {
            if (!entry.getKey().equals(userId)) {
                waitingQueue.remove(entry.getKey());
                return entry.getKey();
            }
        }
        return null;
    }

    private void createSessionAndNotify(Long userAId, Long userBId) {
        try {
            User userA = userRepository.findById(userAId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userAId));
            User userB = userRepository.findById(userBId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userBId));

            ExchangeSession session = exchangeSessionService.startSession(userAId, userBId);
            Long sessionId = session.getId();

            log.info("Created exchange session {} for users {} and {}", sessionId, userAId, userBId);

            messagingTemplate.convertAndSendToUser(
                    userAId.toString(),
                    "/queue/match",
                    Map.of("type", "MATCH_FOUND", "sessionId", sessionId, "partnerId", userBId, "partnerName",
                            userB.getName()));

            messagingTemplate.convertAndSendToUser(
                    userBId.toString(),
                    "/queue/match",
                    Map.of("type", "MATCH_FOUND", "sessionId", sessionId, "partnerId", userAId, "partnerName",
                            userA.getName()));

            // Auto-initiate EXCHANGE call after session creation
            log.info("Auto-initiating call for exchange session {}", sessionId);
            try {
                callService.initiateExchangeCall(userAId, userBId, sessionId);
            } catch (Exception callEx) {
                log.error("Failed to auto-initiate call: {}", callEx.getMessage());
                // Session still valid, users can manually start call
            }
        } catch (Exception e) {
            log.error("Failed to create session for {} and {}: {}", userAId, userBId, e.getMessage());

            messagingTemplate.convertAndSendToUser(
                    userAId.toString(),
                    "/queue/match",
                    Map.of("type", "ERROR", "message", "Failed to create session: " + e.getMessage()));

            waitingQueue.put(userBId, MatchIntent.AUDIO_CALL);
        }
    }

    @MessageMapping("/matching.leave")
    public void leaveMatching(Principal principal) {
        if (principal == null)
            return;

        try {
            Long userId = Long.valueOf(principal.getName());
            waitingQueue.remove(userId);
            log.info("User {} left matching queue. Queue size: {}", userId, waitingQueue.size());
        } catch (NumberFormatException e) {
            // Ignore
        }
    }
}
