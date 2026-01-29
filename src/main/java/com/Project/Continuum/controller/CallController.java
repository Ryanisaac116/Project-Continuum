package com.Project.Continuum.controller;

import com.Project.Continuum.entity.CallSession;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.CallService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * CallController - REST endpoints for call management.
 * 
 * Supports TWO call types:
 * - FRIEND: POST /api/calls/friend/initiate
 * - EXCHANGE: POST /api/calls/exchange/initiate
 */
@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final CallService callService;

    public CallController(CallService callService) {
        this.callService = callService;
    }

    // ==================== FRIEND CALL ====================

    /**
     * Initiate a FRIEND call (anytime call between friends).
     * 
     * Request: { "receiverId": Long }
     */
    @PostMapping("/friend/initiate")
    public ResponseEntity<Map<String, Object>> initiateFriendCall(@RequestBody Map<String, Long> body) {
        Long callerId = SecurityUtils.getCurrentUserId();
        Long receiverId = body.get("receiverId");

        CallSession call = callService.initiateFriendCall(callerId, receiverId);

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "callType", call.getCallType().name(),
                "status", call.getStatus().name()));
    }

    // ==================== EXCHANGE CALL ====================

    /**
     * Initiate an EXCHANGE call (call within an active exchange session).
     * 
     * Request: { "receiverId": Long, "exchangeSessionId": Long }
     */
    @PostMapping("/exchange/initiate")
    public ResponseEntity<Map<String, Object>> initiateExchangeCall(@RequestBody Map<String, Long> body) {
        Long callerId = SecurityUtils.getCurrentUserId();
        Long receiverId = body.get("receiverId");
        Long exchangeSessionId = body.get("exchangeSessionId");

        CallSession call = callService.initiateExchangeCall(callerId, receiverId, exchangeSessionId);

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "callType", call.getCallType().name(),
                "exchangeSessionId", exchangeSessionId,
                "status", call.getStatus().name()));
    }

    // ==================== CALL LIFECYCLE ====================

    /**
     * Get active call for current user (if any)
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveCall() {
        Long userId = SecurityUtils.getCurrentUserId();
        CallSession call = callService.getActiveCall(userId);

        if (call == null) {
            return ResponseEntity.ok(null); // No active call
        }

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "callType", call.getCallType().name(),
                "status", call.getStatus().name(),
                "isCaller", call.getCaller().getId().equals(userId),
                "remoteUserId", call.getCaller().getId().equals(userId) ? call.getReceiver().getId()
                        : call.getCaller().getId(),
                "remoteUserName",
                call.getCaller().getId().equals(userId) ? call.getReceiver().getName() : call.getCaller().getName(),
                "exchangeSessionId", call.getExchangeSession() != null
                        ? call.getExchangeSession().getId()
                        : ""));
    }

    /**
     * Accept an incoming call
     */
    @PostMapping("/{callId}/accept")
    public ResponseEntity<Map<String, Object>> acceptCall(@PathVariable Long callId) {
        Long userId = SecurityUtils.getCurrentUserId();

        CallSession call = callService.acceptCall(userId, callId);

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "callType", call.getCallType().name(),
                "status", call.getStatus().name()));
    }

    /**
     * Reject an incoming call
     */
    @PostMapping("/{callId}/reject")
    public ResponseEntity<Map<String, Object>> rejectCall(@PathVariable Long callId) {
        Long userId = SecurityUtils.getCurrentUserId();

        CallSession call = callService.rejectCall(userId, callId);

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "status", call.getStatus().name()));
    }

    /**
     * End an active call
     */
    @PostMapping("/{callId}/end")
    public ResponseEntity<Map<String, Object>> endCall(@PathVariable Long callId) {
        Long userId = SecurityUtils.getCurrentUserId();

        CallSession call = callService.endCall(userId, callId);

        return ResponseEntity.ok(Map.of(
                "callId", call.getId(),
                "status", call.getStatus().name(),
                "endReason", call.getEndReason() != null ? call.getEndReason().name() : null));
    }

    // ==================== DEV UTILITIES ====================

    /**
     * DEV ONLY: Clear all stuck calls for current user
     */
    @DeleteMapping("/clear-stuck")
    public ResponseEntity<Map<String, Object>> clearStuckCalls() {
        Long userId = SecurityUtils.getCurrentUserId();
        int cleared = callService.clearStuckCallsForUser(userId);
        return ResponseEntity.ok(Map.of("cleared", cleared));
    }
}
