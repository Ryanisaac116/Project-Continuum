package com.Project.Continuum.service;

import com.Project.Continuum.dto.notification.NotificationResponse;
import com.Project.Continuum.entity.Notification;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.NotificationRepository;
import com.Project.Continuum.store.PresenceStore;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
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

    private final NotificationRepository notificationRepository;
    private final PresenceStore presenceStore;
    private final SimpMessageSendingOperations messagingTemplate;
    private final PushNotificationService pushService;
    private final Clock clock;

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
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.presenceStore = presenceStore;
        this.messagingTemplate = messagingTemplate;
        this.pushService = pushService;
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

        // Broadcast via WebSocket if user is online
        PresenceStatus status = presenceStore.getStatus(userId);
        if (status != PresenceStatus.OFFLINE) {
            NotificationResponse response = new NotificationResponse(notification);
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId),
                    "/queue/notifications",
                    response);
        } else {
            // User is offline - send push notification for important types
            if (PUSH_ENABLED_TYPES.contains(type)) {
                pushService.sendToUser(userId, title, message, payload);
            }
        }

        return notification;
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
