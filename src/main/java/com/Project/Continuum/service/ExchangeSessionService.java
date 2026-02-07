package com.Project.Continuum.service;

import com.Project.Continuum.dto.exchange.ExchangeSessionDetailsResponse;
import com.Project.Continuum.dto.exchange.ExchangeSessionResponse;
import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.entity.SkillExchangeRequest;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.repository.SkillExchangeRequestRepository;
import com.Project.Continuum.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ExchangeSessionService {

        private static final Logger log = LoggerFactory.getLogger(ExchangeSessionService.class);

        private final ExchangeSessionRepository exchangeSessionRepository;
        private final SkillExchangeRequestRepository requestRepository;
        private final PresenceService presenceService;
        private final CallService callService;
        private final UserRepository userRepository;
        private final SimpMessageSendingOperations messagingTemplate;
        private final NotificationService notificationService;
        private final Clock clock;

        public ExchangeSessionService(
                        ExchangeSessionRepository exchangeSessionRepository,
                        SkillExchangeRequestRepository requestRepository,
                        PresenceService presenceService,
                        CallService callService,
                        UserRepository userRepository,
                        SimpMessageSendingOperations messagingTemplate,
                        NotificationService notificationService,
                        Clock clock) {
                this.exchangeSessionRepository = exchangeSessionRepository;
                this.requestRepository = requestRepository;
                this.presenceService = presenceService;
                this.callService = callService;
                this.userRepository = userRepository;
                this.messagingTemplate = messagingTemplate;
                this.notificationService = notificationService;
                this.clock = clock;
        }

        /* ================= GET SESSION DETAILS ================= */

        @Transactional(readOnly = true)
        public ExchangeSessionDetailsResponse getSessionDetails(Long sessionId, Long currentUserId) {
                ExchangeSession session = getSessionOrThrow(sessionId);

                if (!session.isParticipant(currentUserId)) {
                        throw new AccessDeniedException("You are not part of this session");
                }

                return new ExchangeSessionDetailsResponse(
                                session.getId(),
                                session.getIntent(),
                                session.getStatus(),
                                session.getStartedAt(),
                                session.getEndedAt(),
                                session.getUserA().getId(),
                                session.getUserA().getName(),
                                session.getUserB().getId(),
                                session.getUserB().getName());
        }

        /* ================= START SESSION ================= */

        public ExchangeSessionResponse startSession(
                        Long requestId,
                        Long currentUserId,
                        ExchangeIntent intent) {

                SkillExchangeRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));

                // Only sender or receiver can start session
                if (!request.getSender().getId().equals(currentUserId)
                                && !request.getReceiver().getId().equals(currentUserId)) {
                        throw new AccessDeniedException("You are not part of this exchange request");
                }

                if (request.getStatus() != com.Project.Continuum.enums.ExchangeRequestStatus.ACCEPTED) {
                        throw new BadRequestException("Session can only be started for ACCEPTED requests");
                }

                User a = request.getSender();
                User b = request.getReceiver();

                // Normalize ordering
                User userA = a.getId() < b.getId() ? a : b;
                User userB = a.getId() < b.getId() ? b : a;

                // Prevent duplicate sessions
                exchangeSessionRepository
                                .findByUserA_IdAndUserB_IdAndStatusIn(
                                                userA.getId(),
                                                userB.getId(),
                                                List.of(
                                                                ExchangeStatus.REQUESTED,
                                                                ExchangeStatus.ACCEPTED,
                                                                ExchangeStatus.ACTIVE))
                                .ifPresent(s -> {
                                        throw new BadRequestException("Session already exists between these users");
                                });

                ExchangeSession session = new ExchangeSession();
                session.setRequest(request);
                session.setUserA(userA);
                session.setUserB(userB);
                session.setIntent(intent);
                session.setStatus(ExchangeStatus.REQUESTED);

                ExchangeSession savedSession = exchangeSessionRepository.save(session);
                ExchangeSessionResponse response = mapToResponse(savedSession);

                // 🔥 Broadcast REQUESTED to receiver
                messagingTemplate.convertAndSendToUser(
                                savedSession.getUserB().getId().toString(),
                                "/queue/session",
                                Map.of(
                                                "type", "SESSION_REQUESTED",
                                                "sessionId", savedSession.getId(),
                                                "requesterId", savedSession.getUserA().getId(),
                                                "requesterName", savedSession.getUserA().getName()));

                return response;
        }

        /**
         * Start session directly between two users (for matching flow)
         * No exchange request required.
         */
        public ExchangeSession startSession(Long userAId, Long userBId) {
                // Normalize ordering (smaller ID first)
                Long minId = Math.min(userAId, userBId);
                Long maxId = Math.max(userAId, userBId);

                // Prevent duplicate active sessions
                // Check for existing active session (Idempotency)
                var existingSession = exchangeSessionRepository
                                .findByUserA_IdAndUserB_IdAndStatusIn(
                                                minId,
                                                maxId,
                                                List.of(
                                                                ExchangeStatus.REQUESTED,
                                                                ExchangeStatus.ACCEPTED,
                                                                ExchangeStatus.ACTIVE));

                if (existingSession.isPresent()) {
                        return existingSession.get();
                }

                // Fetch actual User entities
                User userA = userRepository.findById(minId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + minId));
                User userB = userRepository.findById(maxId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + maxId));

                ExchangeSession session = new ExchangeSession();
                session.setIntent(ExchangeIntent.AUDIO_CALL);
                session.setStatus(ExchangeStatus.ACTIVE); // Start as ACTIVE for matching
                session.setUserA(userA);
                session.setUserB(userB);

                // Update presence to IN_SESSION
                presenceService.updatePresence(userAId, PresenceStatus.IN_SESSION);
                presenceService.updatePresence(userBId, PresenceStatus.IN_SESSION);

                ExchangeSession savedSession = exchangeSessionRepository.save(session);

                // MatchFound handles the notification for this usually, but let's be consistent
                // No broadbast here to avoid double notification with MATCH_FOUND

                return savedSession;
        }

        /* ================= ACCEPT SESSION ================= */

        public ExchangeSessionResponse acceptSession(Long sessionId, Long currentUserId) {

                ExchangeSession session = getSessionOrThrow(sessionId);

                if (!session.isParticipant(currentUserId)) {
                        throw new AccessDeniedException("You are not part of this session");
                }

                if (session.getStatus() != ExchangeStatus.REQUESTED) {
                        throw new BadRequestException("Session is not in REQUESTED state");
                }

                session.setStatus(ExchangeStatus.ACCEPTED);
                ExchangeSession savedSession = exchangeSessionRepository.save(session);
                ExchangeSessionResponse response = mapToResponse(savedSession);

                // 🔥 Broadcast ACCEPTED to requester
                // The requester is the one who created the request.
                // If UserA started (requested), UserB accepts. We notify UserA.
                // UserA is session.getUserA() usually?
                // Wait, startSession logic: UserA/B are sorted.
                // session.getRequest().getSender() is the original requester.

                Long requesterId = session.getRequest().getSender().getId();

                messagingTemplate.convertAndSendToUser(
                                requesterId.toString(),
                                "/queue/session",
                                Map.of(
                                                "type", "SESSION_ACCEPTED",
                                                "sessionId", savedSession.getId(),
                                                "accepterId", currentUserId));

                return response;
        }

        /* ================= ACTIVATE SESSION ================= */

        public ExchangeSessionResponse activateSession(Long sessionId, Long currentUserId) {

                ExchangeSession session = getSessionOrThrow(sessionId);

                if (!session.isParticipant(currentUserId)) {
                        throw new AccessDeniedException("You are not part of this session");
                }

                if (session.getStatus() != ExchangeStatus.ACCEPTED) {
                        throw new BadRequestException("Session must be ACCEPTED to activate");
                }

                // 🔒 NEW GUARD: prevent activation if any user is already BUSY
                User userA = session.getUserA();
                User userB = session.getUserB();

                if (userA.getPresenceStatus() == PresenceStatus.BUSY
                                || userB.getPresenceStatus() == PresenceStatus.BUSY) {
                        throw new BadRequestException(
                                        "One or more participants are already in another session");
                }

                session.setStatus(ExchangeStatus.ACTIVE);
                session.setStartedAt(Instant.now(clock));

                ExchangeSession saved = exchangeSessionRepository.save(session);

                // 🔥 AUTO PRESENCE → BUSY
                presenceService.updatePresence(userA.getId(), PresenceStatus.BUSY);
                presenceService.setUserSession(userA.getId(), saved.getId()); // NEW

                presenceService.updatePresence(userB.getId(), PresenceStatus.BUSY);
                presenceService.setUserSession(userB.getId(), saved.getId()); // NEW

                broadcastSessionStarted(saved);

                return mapToResponse(saved);
        }

        // Helper to broadcast start & notify
        private void broadcastSessionStarted(ExchangeSession session) {
                // 1. Data Broadcast (for dashboard/state)
                Map<String, Object> event = Map.of(
                                "type", "SESSION_STARTED",
                                "sessionId", session.getId());

                messagingTemplate.convertAndSendToUser(
                                session.getUserA().getId().toString(),
                                "/queue/session",
                                event);
                messagingTemplate.convertAndSendToUser(
                                session.getUserB().getId().toString(),
                                "/queue/session",
                                event);

                // 2. User Notification (Toast/History)
                notificationService.createNotification(
                                session.getUserA().getId(),
                                NotificationType.MATCH_FOUND, // Or similar type
                                "Exchange Started",
                                "Your session with " + session.getUserB().getName() + " has started.",
                                "{\"sessionId\":" + session.getId() + "}");

                notificationService.createNotification(
                                session.getUserB().getId(),
                                NotificationType.MATCH_FOUND,
                                "Exchange Started",
                                "Your session with " + session.getUserA().getName() + " has started.",
                                "{\"sessionId\":" + session.getId() + "}");
        }

        /* ================= END SESSION ================= */

        public ExchangeSessionResponse endSession(Long sessionId, Long currentUserId) {
                ExchangeSession session = getSessionOrThrow(sessionId);

                if (!session.isParticipant(currentUserId)) {
                        throw new AccessDeniedException("You are not part of this session");
                }

                // Allow ending if ACTIVE or ACCEPTED
                if (session.getStatus() != ExchangeStatus.ACTIVE && session.getStatus() != ExchangeStatus.ACCEPTED) {
                        throw new BadRequestException(
                                        "Only ACTIVE sessions can be ended. Current: " + session.getStatus());
                }

                // 1. End active calls first (to avoid loop if called from CallService, but here
                // we initiate)
                callService.endCallsForExchange(sessionId);

                // 2. Complete session logic
                return completeSessionInternal(session, currentUserId);
        }

        /**
         * Internal method to finalize session state, presence, and notifications.
         * Safe to call from CallService.
         */
        public ExchangeSessionResponse completeSessionInternal(ExchangeSession session, Long endedByUserId) {
                if (session.getStatus() == ExchangeStatus.COMPLETED) {
                        return mapToResponse(session);
                }

                session.setStatus(ExchangeStatus.COMPLETED);
                session.setEndedAt(Instant.now(clock));
                ExchangeSession saved = exchangeSessionRepository.save(session);

                // RESTORE PRESENCE -> ONLINE
                presenceService.updatePresence(saved.getUserA().getId(), PresenceStatus.ONLINE);
                presenceService.setUserSession(saved.getUserA().getId(), null);

                presenceService.updatePresence(saved.getUserB().getId(), PresenceStatus.ONLINE);
                presenceService.setUserSession(saved.getUserB().getId(), null);

                // Get name
                String endingUserName = "System";
                if (endedByUserId != null && endedByUserId != 0L) {
                        endingUserName = userRepository.findById(endedByUserId)
                                        .map(User::getName).orElse("Unknown");
                }

                // Notify
                Map<String, Object> event = Map.of(
                                "type", "SESSION_ENDED",
                                "sessionId", session.getId(),
                                "endedByUserId", endedByUserId != null ? endedByUserId : 0L,
                                "endedByUserName", endingUserName);

                messagingTemplate.convertAndSendToUser(saved.getUserA().getId().toString(), "/queue/session", event);
                messagingTemplate.convertAndSendToUser(saved.getUserB().getId().toString(), "/queue/session", event);

                return mapToResponse(saved);
        }

        /* ================= SYSTEM TIMEOUT ================= */

        public void expireSession(Long sessionId) {
                ExchangeSession session = getSessionOrThrow(sessionId);

                // Race condition check
                if (session.getStatus() != ExchangeStatus.ACTIVE) {
                        return;
                }

                session.setStatus(ExchangeStatus.COMPLETED);
                session.setEndedAt(Instant.now(clock));

                ExchangeSession saved = exchangeSessionRepository.save(session);

                // End any active calls linked to this exchange (best-effort)
                try {
                        callService.endCallsForExchange(sessionId);
                } catch (Exception e) {
                        log.error("Failed to end calls for expired session {}: {}", sessionId, e.getMessage());
                        // Continue with session expiry regardless
                }

                // RESTORE PRESENCE → ONLINE
                presenceService.updatePresence(saved.getUserA().getId(), PresenceStatus.ONLINE);
                presenceService.setUserSession(saved.getUserA().getId(), null);

                presenceService.updatePresence(saved.getUserB().getId(), PresenceStatus.ONLINE);
                presenceService.setUserSession(saved.getUserB().getId(), null);

                // Notify BOTH users via WebSocket
                Map<String, Object> event = Map.of(
                                "type", "SESSION_ENDED",
                                "sessionId", sessionId,
                                "endedByUserId", 0L, // System
                                "endedByUserName", "System Timeout");

                messagingTemplate.convertAndSendToUser(
                                saved.getUserA().getId().toString(),
                                "/queue/session",
                                event);
                messagingTemplate.convertAndSendToUser(
                                saved.getUserB().getId().toString(),
                                "/queue/session",
                                event);

        }

        /* ================= HELPERS ================= */

        private ExchangeSession getSessionOrThrow(Long sessionId) {
                return exchangeSessionRepository.findById(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Exchange session not found"));
        }

        private ExchangeSessionResponse mapToResponse(ExchangeSession session) {
                return new ExchangeSessionResponse(
                                session.getId(),
                                session.getIntent(),
                                session.getStatus(),
                                session.getStartedAt(),
                                session.getEndedAt());
        }
}
