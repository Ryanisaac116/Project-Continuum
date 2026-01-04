package com.Project.Continuum.service;

import com.Project.Continuum.dto.call.CallSignalMessage;
import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CallSignalingService {

    private final ExchangeSessionRepository exchangeSessionRepository;
    private final ExchangeSessionService exchangeSessionService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final com.Project.Continuum.store.CallStateStore callStateStore;

    public CallSignalingService(ExchangeSessionRepository exchangeSessionRepository,
            ExchangeSessionService exchangeSessionService,
            SimpMessageSendingOperations messagingTemplate,
            com.Project.Continuum.store.CallStateStore callStateStore) {
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.exchangeSessionService = exchangeSessionService;
        this.messagingTemplate = messagingTemplate;
        this.callStateStore = callStateStore;
    }

    public void handleSignal(Long senderId, CallSignalMessage message) {

        Long sessionId = message.getSessionId();
        if (sessionId == null) {
            throw new BadRequestException("Session ID is required for signaling");
        }

        ExchangeSession session = exchangeSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange session not found"));

        // 1. Validate Session Status
        if (session.getStatus() != ExchangeStatus.ACTIVE) {
            throw new BadRequestException("Signaling is only allowed for ACTIVE sessions");
        }

        // 2. Validate Sender Participation
        if (!session.isParticipant(senderId)) {
            throw new AccessDeniedException("You are not a participant of this session");
        }

        // UPDATE HEARTBEAT
        callStateStore.updateHeartbeat(sessionId);

        // LIFECYCLE HOOKS
        if (message.getType() == com.Project.Continuum.enums.CallSignalType.END_CALL ||
                message.getType() == com.Project.Continuum.enums.CallSignalType.REJECT) {

            // Route the message first so user UI can react
            relayMessage(session, senderId, message);

            // Then close session
            exchangeSessionService.endSession(sessionId, senderId);
            callStateStore.removeSession(sessionId);
            return; // Stop here
        }

        // Relay Normal Messages
        relayMessage(session, senderId, message);
    }

    private void relayMessage(ExchangeSession session, Long senderId, CallSignalMessage message) {
        // 3. Determine Recipient
        Long recipientId;
        if (session.getUserA().getId().equals(senderId)) {
            recipientId = session.getUserB().getId();
        } else {
            recipientId = session.getUserA().getId();
        }

        // Optional: If message provides recipientId, validate it matches
        if (message.getRecipientId() != null && !message.getRecipientId().equals(recipientId)) {
            throw new BadRequestException("Invalid recipient for this session");
        }

        // 4. Relay Protocol
        message.setRecipientId(recipientId);

        // Send to Recipient's User Queue
        messagingTemplate.convertAndSendToUser(
                String.valueOf(recipientId),
                "/queue/call-signal",
                message);
    }
}
