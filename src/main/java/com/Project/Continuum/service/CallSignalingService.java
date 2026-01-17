package com.Project.Continuum.service;

import com.Project.Continuum.dto.call.CallSignalMessage;
import com.Project.Continuum.entity.CallSession;
import com.Project.Continuum.enums.CallStatus;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.CallSessionRepository;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * CallSignalingService - Handles WebRTC signaling for friend calls
 * 
 * Phase 6: Relays OFFER/ANSWER/ICE_CANDIDATE between call participants
 */
@Service
@Transactional
public class CallSignalingService {

    private final CallSessionRepository callSessionRepository;
    private final SimpMessageSendingOperations messagingTemplate;

    public CallSignalingService(
            CallSessionRepository callSessionRepository,
            SimpMessageSendingOperations messagingTemplate) {
        this.callSessionRepository = callSessionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void handleSignal(Long senderId, CallSignalMessage message) {
        Long callId = message.getSessionId(); // Frontend sends callId as sessionId
        if (callId == null) {
            throw new BadRequestException("Call ID is required for signaling");
        }

        CallSession call = callSessionRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));

        // 1. Validate call is ACCEPTED (active)
        if (call.getStatus() != CallStatus.ACCEPTED) {
            throw new BadRequestException("Signaling is only allowed for ACCEPTED calls");
        }

        // 2. Validate sender is participant
        boolean isCaller = call.getCaller().getId().equals(senderId);
        boolean isReceiver = call.getReceiver().getId().equals(senderId);
        if (!isCaller && !isReceiver) {
            throw new AccessDeniedException("You are not a participant of this call");
        }

        // 3. Determine recipient (the other party)
        Long recipientId = isCaller ? call.getReceiver().getId() : call.getCaller().getId();

        // 4. Relay the signal to recipient
        message.setRecipientId(recipientId);

        messagingTemplate.convertAndSendToUser(
                String.valueOf(recipientId),
                "/queue/call-signal",
                message);
    }
}
