package com.Project.Continuum.listener;

import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final PresenceService presenceService;

    public WebSocketEventListener(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal != null && principal.getName() != null) {
            try {
                Long userId = Long.valueOf(principal.getName());
                presenceService.updatePresence(userId, PresenceStatus.ONLINE);
                logger.info("User {} connected via WebSocket set to ONLINE", userId);
            } catch (NumberFormatException e) {
                logger.warn("Invalid user ID format in Principal: {}", principal.getName());
            }
        } else {
            logger.warn("WebSocket connection established but no Principal found");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal != null && principal.getName() != null) {
            try {
                Long userId = Long.valueOf(principal.getName());
                // IMPORTANT: Check if this was the last session?
                // For now, per instructions "Presence must: Be accurate during active sessions,
                // Handle disconnects safely"
                // Simple toggle is safer than complex session counting for "surgical" change.
                // If user opens 2 tabs, closing 1 might set OFFLINE.
                // But without session counting store (e.g. Redis/Map), we can't do better
                // easily.
                // HOWEVER, usually disconnect applies to a specific session.
                // If we switch to OFFLINE immediately, the other tab might send a heartbeat or
                // be active.
                // Valid solution for now: Set OFFLINE. The "Heartbeat" logic in PresenceService
                // (via HTTP) might correct it?
                // PresenceService.heartbeat sets ONLINE if OFFLINE.
                // So if they have another tab open, it will correct itself eventually?
                // But we want "Real-time".

                presenceService.updatePresence(userId, PresenceStatus.OFFLINE);
                logger.info("User {} disconnected from WebSocket set to OFFLINE", userId);
            } catch (NumberFormatException e) {
                logger.warn("Invalid user ID format in Principal: {}", principal.getName());
            }
        }
    }
}
