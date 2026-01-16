package com.Project.Continuum.controller;

import com.Project.Continuum.entity.PushSubscription;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PushController - REST endpoints for web push subscription management.
 * 
 * Endpoints:
 * - GET /api/push/vapid-public-key - Get public VAPID key for subscription
 * - POST /api/push/subscribe - Subscribe to push notifications
 * - DELETE /api/push/unsubscribe - Unsubscribe from push notifications
 */
@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    /**
     * Get the public VAPID key for frontend subscription.
     */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getPublicKey()));
    }

    /**
     * Subscribe to push notifications.
     * 
     * Request body:
     * {
     * "endpoint": "https://...",
     * "keys": {
     * "p256dh": "...",
     * "auth": "..."
     * }
     * }
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, Object>> subscribe(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtils.getCurrentUserId();

        String endpoint = (String) body.get("endpoint");
        @SuppressWarnings("unchecked")
        Map<String, String> keys = (Map<String, String>) body.get("keys");
        String p256dh = keys.get("p256dh");
        String auth = keys.get("auth");

        PushSubscription subscription = pushService.saveSubscription(userId, endpoint, p256dh, auth);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "subscriptionId", subscription.getId()));
    }

    /**
     * Unsubscribe from push notifications.
     * 
     * Request body:
     * {
     * "endpoint": "https://..."
     * }
     */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Map<String, Object>> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        pushService.removeSubscription(endpoint);

        return ResponseEntity.ok(Map.of("success", true));
    }
}
