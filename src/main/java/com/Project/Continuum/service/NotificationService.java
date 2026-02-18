package com.Project.Continuum.service;

import com.Project.Continuum.dto.notification.NotificationResponse;
import com.Project.Continuum.entity.Notification;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.enums.PresenceStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.NotificationRepository;
import com.Project.Continuum.store.PresenceStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * NotificationService - Central service for all notifications.
 * 
 * All notification creation MUST go through this service.
 * Handles persistence + real-time WebSocket delivery + push notification
 * fallback.
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final PresenceStore presenceStore;
    private final SimpMessageSendingOperations messagingTemplate;
    private final PushNotificationService pushService;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private static final Duration REALTIME_ACTIVITY_WINDOW = Duration.ofMinutes(2);

    // Notification types that should trigger push when user is offline
    private static final List<NotificationType> PUSH_ENABLED_TYPES = List.of(
            NotificationType.CALL_INCOMING,
            NotificationType.CALL_MISSED,
            NotificationType.CHAT_MESSAGE,
            NotificationType.MATCH_FOUND,
            NotificationType.FRIEND_REQUEST_RECEIVED,
            NotificationType.FRIEND_REQUEST_ACCEPTED);

    public NotificationService(
            NotificationRepository notificationRepository,
            PresenceStore presenceStore,
            SimpMessageSendingOperations messagingTemplate,
            PushNotificationService pushService,
            ObjectMapper objectMapper,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.presenceStore = presenceStore;
        this.messagingTemplate = messagingTemplate;
        this.pushService = pushService;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * Create and persist a notification, then broadcast if user is online.
     * 
     * @param userId  Recipient user ID
     * @param type    Notification type
     * @param title   Short title
     * @param message Detailed message
     * @param payload Optional JSON payload for routing/deep linking
     * @return The created notification
     */
    @Transactional
    public Notification createNotification(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String payload) {

        // Always persist
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setPayload(payload);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now(clock));

        notificationRepository.save(notification);

        boolean hasLiveSocket = isRealtimeReachable(userId);

        if (hasLiveSocket) {
            NotificationResponse response = new NotificationResponse(notification);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/notifications",
                    response);
            return notification;
        }

        // User is offline/unreachable - send push notification for important types
        if (PUSH_ENABLED_TYPES.contains(type)) {
            pushService.sendToUser(userId, title, message, buildPushData(userId, type, payload));
        }

        return notification;
    }

    private boolean isRealtimeReachable(Long userId) {
        PresenceStatus status = presenceStore.getStatus(userId);
        int connectionCount = presenceStore.getConnectionCount(userId);

        if (connectionCount <= 0 || status == PresenceStatus.OFFLINE) {
            return false;
        }

        Instant lastSeen = presenceStore.getLastSeen(userId);
        if (lastSeen == null) {
            return true;
        }

        Instant cutoff = Instant.now(clock).minus(REALTIME_ACTIVITY_WINDOW);
        return !lastSeen.isBefore(cutoff);
    }

    private String buildPushData(Long recipientUserId, NotificationType type, String payload) {
        ObjectNode dataNode = objectMapper.createObjectNode();

        if (payload != null && !payload.isBlank()) {
            try {
                JsonNode parsed = objectMapper.readTree(payload);
                if (parsed != null && parsed.isObject()) {
                    dataNode.setAll((ObjectNode) parsed);
                }
            } catch (Exception ignored) {
                // Keep push delivery resilient even if payload is malformed JSON.
            }
        }

        dataNode.put("type", type.name());
        dataNode.put("url", resolveNotificationUrl(recipientUserId, type, dataNode));
        return dataNode.toString();
    }

    private String resolveNotificationUrl(Long recipientUserId, NotificationType type, ObjectNode dataNode) {
        return switch (type) {
            case CHAT_MESSAGE -> {
                Long senderId = getLong(dataNode, "senderId");
                yield senderId != null ? "/chat/" + senderId : "/app";
            }
            case CALL_INCOMING, CALL_MISSED -> {
                Long counterpartId = firstNonNull(
                        getLong(dataNode, "callerId"),
                        getLong(dataNode, "receiverId"),
                        getLong(dataNode, "senderId"),
                        getLong(dataNode, "friendId"),
                        getLong(dataNode, "requesterId"));
                if (counterpartId != null && !counterpartId.equals(recipientUserId)) {
                    yield "/chat/" + counterpartId;
                }
                yield "/friends?section=friends";
            }
            case FRIEND_REQUEST_RECEIVED -> "/friends?section=requests";
            case FRIEND_REQUEST_ACCEPTED -> "/friends?section=friends";
            case MATCH_FOUND -> "/exchanges";
            case SYSTEM -> "/app";
        };
    }

    private static Long getLong(ObjectNode dataNode, String field) {
        JsonNode node = dataNode.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isIntegralNumber()) {
            return node.longValue();
        }
        if (node.isTextual()) {
            try {
                return Long.parseLong(node.textValue());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    /**
     * Get unread notifications for a user.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findUnreadByUserId(userId)
                .stream()
                .map(NotificationResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get recent notifications (up to 50) for a user.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentNotifications(Long userId, int limit) {
        return notificationRepository.findRecentByUserId(userId, PageRequest.of(0, limit))
                .stream()
                .map(NotificationResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications for badge display.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    /**
     * Mark a notification as read.
     */
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Security: ensure user owns this notification
        if (!notification.getUserId().equals(userId)) {
            throw new AccessDeniedException("Cannot access other user's notifications");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for a user.
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findUnreadByUserId(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    /**
     * Clear all notifications for a user.
     */
    @Transactional
    public void clearAllNotifications(Long userId) {
        notificationRepository.deleteAllByUserId(userId);

        // Broadcast "NOTIFICATIONS_CLEARED" event
        // We send a Map because it's a special system event, not a Notification entity
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),
                "/queue/notifications",
                java.util.Map.of("type", "NOTIFICATIONS_CLEARED"));
    }

    /**
     * Mark all chat notifications from a specific sender as read.
     */
    @Transactional
    public void markChatNotificationsAsRead(Long userId, Long senderId) {
        String payloadPattern = "\"senderId\":" + senderId;
        List<Notification> unread = notificationRepository.findUnreadChatNotificationsBySender(userId, payloadPattern);

        if (unread.isEmpty()) {
            return;
        }

        for (Notification n : unread) {
            n.setRead(true);

            // Broadcast READ event
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/notifications",
                    java.util.Map.of(
                            "type", "NOTIFICATION_READ",
                            "id", n.getId()));
        }
        notificationRepository.saveAll(unread);
    }
}
