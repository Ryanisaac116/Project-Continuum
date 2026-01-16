package com.Project.Continuum.listener;

import com.Project.Continuum.dto.presence.PresenceResponse;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.service.PresenceService;
import com.Project.Continuum.store.PresenceStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * WebSocketEventListener - Handles WebSocket connect/disconnect events.
 * 
 * Key optimization: Uses connection counting to support multi-tab scenarios.
 * User only goes OFFLINE when ALL tabs are closed.
 */
@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final PresenceService presenceService;
    private final PresenceStore presenceStore;
    private final SimpMessageSendingOperations messagingTemplate;
    private final com.Project.Continuum.service.CallService callService;

    public WebSocketEventListener(
            PresenceService presenceService,
            PresenceStore presenceStore,
            SimpMessageSendingOperations messagingTemplate,
            com.Project.Continuum.service.CallService callService) {
        this.presenceService = presenceService;
        this.presenceStore = presenceStore;
        this.messagingTemplate = messagingTemplate;
        this.callService = callService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal == null || principal.getName() == null) {
            logger.warn("WebSocket connection without Principal");
            return;
        }

        try {
            Long userId = Long.valueOf(principal.getName());

            // Increment connection count
            int connections = presenceStore.addConnection(userId);

            // Always update presence to ONLINE on connect
            presenceService.updatePresence(userId, PresenceStatus.ONLINE);

            // Notify CallService of reconnection (cancels any disconnect timers)
            callService.onUserConnect(userId);

            logger.info("🟢 User {} connected (total connections: {})", userId, connections);
        } catch (NumberFormatException e) {
            logger.warn("Invalid user ID format: {}", principal.getName());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null || principal.getName() == null) {
            return;
        }

        try {
            Long userId = Long.valueOf(principal.getName());

            // Decrement connection count - returns true if this was the last connection
            boolean wasLastConnection = presenceStore.removeConnection(userId);

            if (wasLastConnection) {
                // Only set OFFLINE if no more connections
                presenceService.updatePresence(userId, PresenceStatus.OFFLINE);

                // Notify CallService of disconnection (starts grace timer)
                callService.onUserDisconnect(userId);

                logger.info("🔴 User {} disconnected (last connection) - now OFFLINE", userId);
            } else {
                int remaining = presenceStore.getConnectionCount(userId);
                logger.info("🟡 User {} disconnected but has {} other connection(s) - staying ONLINE",
                        userId, remaining);

                // Broadcast current status to ensure UI is updated
                PresenceResponse response = new PresenceResponse(
                        userId, presenceStore.getStatus(userId), LocalDateTime.now());
                messagingTemplate.convertAndSend("/topic/presence/" + userId, response);
            }
        } catch (NumberFormatException e) {
            logger.warn("Invalid user ID format: {}", principal.getName());
        }
    }
}
