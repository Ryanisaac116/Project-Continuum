package com.Project.Continuum.service;

import com.Project.Continuum.dto.exchange.ExchangeSessionResponse;
import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.entity.SkillExchangeRequest;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.enums.PresenceStatus; // ✅ NEW
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.repository.SkillExchangeRequestRepository;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExchangeSessionService {

    private final ExchangeSessionRepository exchangeSessionRepository;
    private final SkillExchangeRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService; // ✅ NEW

    public ExchangeSessionService(
            ExchangeSessionRepository exchangeSessionRepository,
            SkillExchangeRequestRepository requestRepository,
            UserRepository userRepository,
            PresenceService presenceService // ✅ NEW
    ) {
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
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

        return mapToResponse(exchangeSessionRepository.save(session));
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
        return mapToResponse(exchangeSessionRepository.save(session));
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
        session.setStartedAt(LocalDateTime.now());

        ExchangeSession saved = exchangeSessionRepository.save(session);

        // 🔥 AUTO PRESENCE → BUSY
        presenceService.updatePresence(userA.getId(), PresenceStatus.BUSY);
        presenceService.setUserSession(userA.getId(), saved.getId()); // NEW

        presenceService.updatePresence(userB.getId(), PresenceStatus.BUSY);
        presenceService.setUserSession(userB.getId(), saved.getId()); // NEW

        return mapToResponse(saved);
    }

    /* ================= END SESSION ================= */

    public ExchangeSessionResponse endSession(Long sessionId, Long currentUserId) {

        ExchangeSession session = getSessionOrThrow(sessionId);

        if (!session.isParticipant(currentUserId)) {
            throw new AccessDeniedException("You are not part of this session");
        }

        if (session.getStatus() != ExchangeStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE sessions can be ended");
        }

        session.setStatus(ExchangeStatus.COMPLETED);
        session.setEndedAt(LocalDateTime.now());

        ExchangeSession saved = exchangeSessionRepository.save(session);

        // 🔥 RESTORE PRESENCE → ONLINE (NEW)
        presenceService.updatePresence(saved.getUserA().getId(), PresenceStatus.ONLINE);
        presenceService.setUserSession(saved.getUserA().getId(), null); // NEW

        presenceService.updatePresence(saved.getUserB().getId(), PresenceStatus.ONLINE);
        presenceService.setUserSession(saved.getUserB().getId(), null); // NEW

        return mapToResponse(saved);
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
