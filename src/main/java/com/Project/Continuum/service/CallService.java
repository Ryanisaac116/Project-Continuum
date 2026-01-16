package com.Project.Continuum.service;

import com.Project.Continuum.entity.CallSession;
import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.CallEndReason;
import com.Project.Continuum.enums.CallStatus;
import com.Project.Continuum.enums.CallType;
import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.enums.FriendStatus;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.CallSessionRepository;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.store.PresenceStore;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.TaskScheduler;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * CallService - Handles call lifecycle (signaling phase).
 * 
 * Supports TWO call types:
 * - FRIEND: Casual calls between ACCEPTED friends (anytime)
 * - EXCHANGE: Calls within an ACTIVE exchange session (no friendship required)
 */
@Service
public class CallService {

    private static final Logger log = LoggerFactory.getLogger(CallService.class);

    private final CallSessionRepository callSessionRepository;
    private final ExchangeSessionRepository exchangeSessionRepository;
    private final UserRepository userRepository;
    private final FriendRepository friendRepository;
    private final PresenceStore presenceStore;
    private final PresenceService presenceService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;

    public CallService(
            CallSessionRepository callSessionRepository,
            ExchangeSessionRepository exchangeSessionRepository,
            UserRepository userRepository,
            FriendRepository friendRepository,
            PresenceStore presenceStore,
            PresenceService presenceService,
            SimpMessageSendingOperations messagingTemplate,
            NotificationService notificationService,
            TaskScheduler taskScheduler) {
        this.callSessionRepository = callSessionRepository;
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.userRepository = userRepository;
        this.friendRepository = friendRepository;
        this.presenceStore = presenceStore;
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.taskScheduler = taskScheduler;
    }

    // ==================== FRIEND CALL ====================

    /**
     * Initiate a FRIEND call (anytime call between friends).
     * 
     * Requirements:
     * - Users must be ACCEPTED friends
     * - Neither user has an active call
     * - Caller must not be OFFLINE
     */
    @Transactional
    public CallSession initiateFriendCall(Long callerId, Long receiverId) {
        // Validation: No self-calls
        if (callerId.equals(receiverId)) {
            throw new AccessDeniedException("Cannot call yourself");
        }

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        // FRIEND CALL: Must be ACCEPTED friends
        if (!areFriends(callerId, receiverId)) {
            throw new AccessDeniedException("You can only make friend calls with accepted friends");
        }

        // Validate no active calls
        validateNoActiveCall(callerId, receiverId);

        // Validate caller is not offline
        PresenceStatus callerStatus = presenceStore.getStatus(callerId);
        if (callerStatus == PresenceStatus.OFFLINE) {
            throw new AccessDeniedException("You must be online to make a call");
        }

        // Create FRIEND call session
        CallSession call = new CallSession();
        call.setCaller(caller);
        call.setReceiver(receiver);
        call.setStatus(CallStatus.RINGING);
        call.setCallType(CallType.FRIEND);
        call.setExchangeSession(null); // FRIEND calls have no exchange
        call.setInitiatedAt(LocalDateTime.now());
        callSessionRepository.save(call);

        // Broadcast and notify
        broadcastCallInitiate(call, CallType.FRIEND);

        return call;
    }

    // ==================== EXCHANGE CALL ====================

    /**
     * Initiate an EXCHANGE call (call within an active exchange session).
     * 
     * Requirements:
     * - Exchange session must exist and be ACTIVE
     * - Both users must be participants of the exchange
     * - Friendship is NOT required
     * - Neither user has an active call
     */
    @Transactional
    public CallSession initiateExchangeCall(Long callerId, Long receiverId, Long exchangeSessionId) {
        // Validation: No self-calls
        if (callerId.equals(receiverId)) {
            throw new AccessDeniedException("Cannot call yourself");
        }

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        // EXCHANGE CALL: Exchange must exist and be ACTIVE
        ExchangeSession exchange = exchangeSessionRepository.findById(exchangeSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange session not found"));

        if (exchange.getStatus() != ExchangeStatus.ACTIVE) {
            throw new BadRequestException("Exchange session is not active");
        }

        // Both users must be participants
        if (!exchange.isParticipant(callerId) || !exchange.isParticipant(receiverId)) {
            throw new AccessDeniedException("Both users must be participants of the exchange");
        }

        // Validate no active calls
        validateNoActiveCall(callerId, receiverId);

        // Validate caller is not offline
        PresenceStatus callerStatus = presenceStore.getStatus(callerId);
        if (callerStatus == PresenceStatus.OFFLINE) {
            throw new AccessDeniedException("You must be online to make a call");
        }

        // Create EXCHANGE call session
        CallSession call = new CallSession();
        call.setCaller(caller);
        call.setReceiver(receiver);
        call.setStatus(CallStatus.RINGING);
        call.setCallType(CallType.EXCHANGE);
        call.setExchangeSession(exchange);
        call.setInitiatedAt(LocalDateTime.now());
        callSessionRepository.save(call);

        // Broadcast and notify
        broadcastCallInitiate(call, CallType.EXCHANGE);

        return call;
    }

    // ==================== ACCEPT CALL ====================

    @Transactional
    public CallSession acceptCall(Long userId, Long callId) {
        CallSession call = callSessionRepository.findByIdAndUserId(callId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));

        // Only receiver can accept
        if (!call.getReceiver().getId().equals(userId)) {
            throw new AccessDeniedException("Only the receiver can accept the call");
        }

        // Must be in RINGING status
        if (call.getStatus() != CallStatus.RINGING) {
            throw new AccessDeniedException("Call is not in ringing state");
        }

        // For EXCHANGE calls, verify exchange is still active
        if (call.getCallType() == CallType.EXCHANGE) {
            ExchangeSession exchange = call.getExchangeSession();
            if (exchange == null || exchange.getStatus() != ExchangeStatus.ACTIVE) {
                // Exchange ended before call was accepted
                call.setStatus(CallStatus.ENDED);
                call.setEndedAt(LocalDateTime.now());
                call.setEndReason(CallEndReason.EXCHANGE_ENDED);
                callSessionRepository.save(call);
                throw new BadRequestException("Exchange session has ended");
            }
        }

        // Update call status
        call.setStatus(CallStatus.ACCEPTED);
        call.setAcceptedAt(LocalDateTime.now());
        callSessionRepository.save(call);

        // Transition both users to IN_SESSION
        presenceService.updatePresence(call.getCaller().getId(), PresenceStatus.IN_SESSION);
        presenceService.updatePresence(call.getReceiver().getId(), PresenceStatus.IN_SESSION);

        // Broadcast CALL_ACCEPT to both
        Map<String, Object> payload = Map.of(
                "event", "CALL_ACCEPT",
                "callId", callId,
                "callType", call.getCallType().name());
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getCaller().getId()),
                "/queue/calls",
                payload);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getReceiver().getId()),
                "/queue/calls",
                payload);

        return call;
    }

    // ==================== REJECT CALL ====================

    @Transactional
    public CallSession rejectCall(Long userId, Long callId) {
        CallSession call = callSessionRepository.findByIdAndUserId(callId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));

        // Only receiver can reject
        if (!call.getReceiver().getId().equals(userId)) {
            throw new AccessDeniedException("Only the receiver can reject the call");
        }

        // Must be in RINGING status
        if (call.getStatus() != CallStatus.RINGING) {
            throw new AccessDeniedException("Call is not in ringing state");
        }

        // Update call status
        call.setStatus(CallStatus.REJECTED);
        call.setEndedAt(LocalDateTime.now());
        call.setEndReason(CallEndReason.REJECTED);
        callSessionRepository.save(call);

        // Broadcast CALL_REJECT to both parties
        Map<String, Object> payload = Map.of(
                "event", "CALL_REJECT",
                "callId", callId,
                "reason", "REJECTED");
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getCaller().getId()),
                "/queue/calls",
                payload);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getReceiver().getId()),
                "/queue/calls",
                payload);

        // Create CALL_MISSED notification for caller
        notificationService.createNotification(
                call.getCaller().getId(),
                NotificationType.CALL_MISSED,
                "Missed call",
                call.getReceiver().getName() + " declined your call",
                "{\"callerId\":" + call.getCaller().getId() + "}");

        return call;
    }

    // ==================== END CALL ====================

    @Transactional
    public CallSession endCall(Long userId, Long callId) {
        CallSession call = callSessionRepository.findByIdAndUserId(callId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));

        // Either party can end
        if (!call.isParticipant(userId)) {
            throw new AccessDeniedException("You are not part of this call");
        }

        // Must be in RINGING or ACCEPTED to end
        if (!call.isActive()) {
            throw new AccessDeniedException("Call has already ended");
        }

        // Determine end reason
        CallEndReason endReason = CallEndReason.COMPLETED;
        if (call.getStatus() == CallStatus.RINGING) {
            endReason = CallEndReason.CANCELLED;
        }

        return endCallInternal(call, endReason);
    }

    // ==================== EXCHANGE-TRIGGERED CALL END ====================

    /**
     * End all active calls linked to an exchange session.
     * Called when an exchange session ends.
     */
    @Transactional
    public int endCallsForExchange(Long exchangeSessionId) {
        List<CallSession> activeCalls = callSessionRepository.findActiveCallsByExchangeSessionId(
                exchangeSessionId,
                List.of(CallStatus.RINGING, CallStatus.ACCEPTED));

        for (CallSession call : activeCalls) {
            endCallInternal(call, CallEndReason.EXCHANGE_ENDED);
        }

        return activeCalls.size();
    }

    // ==================== INTERNAL HELPERS ====================

    private CallSession endCallInternal(CallSession call, CallEndReason endReason) {
        call.setStatus(CallStatus.ENDED);
        call.setEndedAt(LocalDateTime.now());
        call.setEndReason(endReason);
        callSessionRepository.save(call);

        // Transition both users back to ONLINE (only if they were IN_SESSION)
        if (presenceStore.getStatus(call.getCaller().getId()) == PresenceStatus.IN_SESSION) {
            presenceService.updatePresence(call.getCaller().getId(), PresenceStatus.ONLINE);
        }
        if (presenceStore.getStatus(call.getReceiver().getId()) == PresenceStatus.IN_SESSION) {
            presenceService.updatePresence(call.getReceiver().getId(), PresenceStatus.ONLINE);
        }

        // Broadcast CALL_END to both
        Map<String, Object> payload = Map.of(
                "event", "CALL_END",
                "callId", call.getId(),
                "endReason", endReason.name());
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getCaller().getId()),
                "/queue/calls",
                payload);
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getReceiver().getId()),
                "/queue/calls",
                payload);

        return call;
    }

    private void validateNoActiveCall(Long callerId, Long receiverId) {
        if (callSessionRepository.hasActiveCall(callerId)) {
            throw new AccessDeniedException("You already have an active call");
        }
        if (callSessionRepository.hasActiveCall(receiverId)) {
            throw new AccessDeniedException("User is already in a call");
        }
    }

    private void broadcastCallInitiate(CallSession call, CallType callType) {
        Long callerId = call.getCaller().getId();
        Long receiverId = call.getReceiver().getId();

        // Broadcast CALL_INITIATE to receiver
        Map<String, Object> initiatePayload = Map.of(
                "event", "CALL_INITIATE",
                "callId", call.getId(),
                "callType", callType.name(),
                "callerId", callerId,
                "callerName", call.getCaller().getName(),
                "exchangeSessionId", call.getExchangeSession() != null
                        ? call.getExchangeSession().getId()
                        : "");
        messagingTemplate.convertAndSendToUser(
                String.valueOf(receiverId),
                "/queue/calls",
                initiatePayload);

        // Broadcast CALL_RINGING to caller (confirmation)
        Map<String, Object> ringingPayload = Map.of(
                "event", "CALL_RINGING",
                "callId", call.getId(),
                "callType", callType.name(),
                "receiverId", receiverId,
                "receiverName", call.getReceiver().getName(),
                "exchangeSessionId", call.getExchangeSession() != null
                        ? call.getExchangeSession().getId()
                        : "");
        messagingTemplate.convertAndSendToUser(
                String.valueOf(callerId),
                "/queue/calls",
                ringingPayload);

        // Create notification for receiver
        String callTypeLabel = callType == CallType.FRIEND ? "Friend" : "Exchange";
        notificationService.createNotification(
                receiverId,
                NotificationType.CALL_INCOMING,
                callTypeLabel + " call from " + call.getCaller().getName(),
                call.getCaller().getName() + " is calling you",
                "{\"callerId\":" + callerId + ",\"callId\":" + call.getId()
                        + ",\"callType\":\"" + callType.name() + "\"}");
    }

    private boolean areFriends(Long userId1, Long userId2) {
        Long u1 = Math.min(userId1, userId2);
        Long u2 = Math.max(userId1, userId2);
        return friendRepository.existsByUser1_IdAndUser2_IdAndStatus(u1, u2, FriendStatus.ACCEPTED);
    }

    // ==================== DISCONNECT HANDLING ====================

    private final Map<Long, ScheduledFuture<?>> disconnectTimers = new ConcurrentHashMap<>();
    private final TaskScheduler taskScheduler;

    // ... Constructor update required ...

    /**
     * Called when a user disconnects (WebSocket drop).
     * Starts a grace timer to end call if they don't reconnect.
     */
    public void onUserDisconnect(Long userId) {
        // Only relevant if they are in an active call
        if (!callSessionRepository.hasActiveCall(userId)) {
            return;
        }

        log.info("⚠️ User {} disconnected while in call. Starting 15s grace timer.", userId);

        // Cancel existing timer if any (unexpected but safe)
        cancelDisconnectTimer(userId);

        // Schedule disconnect task
        ScheduledFuture<?> timer = taskScheduler.schedule(
                () -> handleDisconnectTimeout(userId),
                Instant.now().plusSeconds(15));

        disconnectTimers.put(userId, timer);
    }

    /**
     * Called when a user reconnects.
     * Cancels any pending disconnect timer.
     */
    public void onUserConnect(Long userId) {
        if (cancelDisconnectTimer(userId)) {
            log.info("✅ User {} reconnected. Grace timer cancelled, call saved.", userId);
        }
    }

    private void handleDisconnectTimeout(Long userId) {
        log.warn("⏰ User {} disconnect grace period expired. Checking for active calls...", userId);
        disconnectTimers.remove(userId);

        // Find active call for this user
        List<CallSession> activeCalls = callSessionRepository.findActiveCallsByUserId(
                userId, List.of(CallStatus.RINGING, CallStatus.ACCEPTED));

        for (CallSession call : activeCalls) {
            try {
                endCallInternal(call, CallEndReason.DISCONNECTED);
                log.info("Call {} ended due to user {} disconnection timeout.", call.getId(), userId);
            } catch (Exception e) {
                log.error("Failed to auto-end call {} for user {}: {}", call.getId(), userId, e.getMessage());
            }
        }
    }

    private boolean cancelDisconnectTimer(Long userId) {
        ScheduledFuture<?> timer = disconnectTimers.remove(userId);
        if (timer != null && !timer.isDone()) {
            timer.cancel(false);
            return true;
        }
        return false;
    }

    // ==================== DEV HELPERS ====================

    /**
     * DEV: Clear all stuck calls for a user
     */
    @Transactional
    public int clearStuckCallsForUser(Long userId) {
        var activeCalls = callSessionRepository.findActiveCallsByUserId(
                userId, List.of(CallStatus.RINGING, CallStatus.ACCEPTED));

        for (CallSession call : activeCalls) {
            endCallInternal(call, CallEndReason.CANCELLED);
        }

        return activeCalls.size();
    }
}
