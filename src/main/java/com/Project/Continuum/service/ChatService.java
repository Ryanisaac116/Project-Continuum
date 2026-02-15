package com.Project.Continuum.service;

import com.Project.Continuum.dto.chat.ChatMessageRequest;
import com.Project.Continuum.dto.chat.ChatMessageResponse;
import com.Project.Continuum.entity.ChatMessage;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.NotificationType;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.ChatMessageRepository;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class ChatService {

        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final FriendRepository friendRepository;
        private final SimpMessageSendingOperations messagingTemplate;
        private final NotificationService notificationService;
        private final Clock clock;

        private final com.Project.Continuum.store.PresenceStore presenceStore;

        @org.springframework.beans.factory.annotation.Autowired
        public ChatService(ChatMessageRepository chatMessageRepository,
                        UserRepository userRepository,
                        FriendRepository friendRepository,
                        SimpMessageSendingOperations messagingTemplate,
                        NotificationService notificationService,
                        Clock clock,
                        com.Project.Continuum.store.PresenceStore presenceStore) {
                this.chatMessageRepository = chatMessageRepository;
                this.userRepository = userRepository;
                this.friendRepository = friendRepository;
                this.messagingTemplate = messagingTemplate;
                this.notificationService = notificationService;
                this.clock = clock;
                this.presenceStore = presenceStore;
        }

        // ==================== SEND MESSAGE ====================
        @Transactional
        public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {

                User sender = userRepository.findById(senderId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

                User recipient = userRepository.findById(request.getRecipientId())
                                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

                // Verify Friendship
                verifyFriendship(sender, recipient);

                ChatMessage message = new ChatMessage();
                message.setSender(sender);
                message.setRecipient(recipient);
                message.setContent(request.getContent());
                message.setSentAt(Instant.now(clock));

                // Check immediate delivery
                com.Project.Continuum.enums.PresenceStatus recipientStatus = presenceStore.getStatus(recipient.getId());
                boolean isDelivered = recipientStatus == com.Project.Continuum.enums.PresenceStatus.ONLINE ||
                                recipientStatus == com.Project.Continuum.enums.PresenceStatus.IN_SESSION;

                if (isDelivered) {
                        message.setDeliveredAt(Instant.now(clock));
                }

                // Handle reply
                if (request.getReplyToId() != null) {
                        ChatMessage replyTo = chatMessageRepository.findById(request.getReplyToId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Reply-to message not found"));
                        message.setReplyTo(replyTo);
                }

                ChatMessage savedMessage = chatMessageRepository.save(message);
                ChatMessageResponse response = toResponse(savedMessage);

                // Broadcast to both users
                broadcastToBoth(sender.getId(), recipient.getId(), response);

                // Create notification for recipient
                String senderName = sender.getName();

                notificationService.createNotification(
                                recipient.getId(),
                                NotificationType.CHAT_MESSAGE,
                                "New message from " + senderName,
                                request.getContent().length() > 50
                                                ? request.getContent().substring(0, 50) + "..."
                                                : request.getContent(),
                                "{\"senderId\":" + sender.getId() + ",\"role\":\""
                                                + (sender.getRole() != null ? sender.getRole() : "USER") + "\"}");

                return response;

        }

        // ==================== MARK SEEN ====================
        @Transactional
        public void markMessagesAsSeen(Long userId, List<Long> messageIds) {
                if (messageIds == null || messageIds.isEmpty())
                        return;

                List<ChatMessage> messages = chatMessageRepository.findAllById(messageIds);
                Instant now = Instant.now(clock);
                boolean anyUpdated = false;

                for (ChatMessage msg : messages) {
                        // Security check: confirm current user is the recipient
                        if (!msg.getRecipient().getId().equals(userId)) {
                                continue;
                        }

                        // Idempotency: only update if not already seen
                        if (msg.getSeenAt() == null) {
                                msg.setSeenAt(now);
                                // Consistency: if deliveredAt is missing, set it too
                                if (msg.getDeliveredAt() == null) {
                                        msg.setDeliveredAt(now);
                                }
                                anyUpdated = true;

                                // Broadcast SEEN event individually
                                java.util.Map<String, Object> payload = java.util.Map.of(
                                                "type", "MESSAGE_SEEN",
                                                "messageId", msg.getId(),
                                                "seenAt", now);

                                messagingTemplate.convertAndSendToUser(String.valueOf(msg.getSender().getId()),
                                                "/queue/messages", payload);
                                messagingTemplate.convertAndSendToUser(String.valueOf(msg.getRecipient().getId()),
                                                "/queue/messages", payload);

                                // Mark associated notifications as read
                                notificationService.markChatNotificationsAsRead(msg.getRecipient().getId(),
                                                msg.getSender().getId());
                        }
                }

                if (anyUpdated) {
                        chatMessageRepository.saveAll(messages);
                }
        }

        @Transactional
        public void markPendingMessagesAsDelivered(Long recipientId) {
                List<ChatMessage> pendingMessages = chatMessageRepository
                                .findByRecipient_IdAndDeliveredAtIsNull(recipientId);

                if (pendingMessages.isEmpty()) {
                        return;
                }

                Instant now = Instant.now(clock);
                for (ChatMessage msg : pendingMessages) {
                        msg.setDeliveredAt(now);

                        // Broadcast DELIVERED event to sender
                        java.util.Map<String, Object> payload = java.util.Map.of(
                                        "type", "MESSAGE_DELIVERED",
                                        "messageId", msg.getId(),
                                        "deliveredAt", now);

                        // Notify sender that their message was delivered
                        messagingTemplate.convertAndSendToUser(
                                        String.valueOf(msg.getSender().getId()),
                                        "/queue/messages",
                                        payload);

                        // Also notify recipient (so their own UI updates if they have multiple devices)
                        messagingTemplate.convertAndSendToUser(
                                        String.valueOf(msg.getRecipient().getId()),
                                        "/queue/messages",
                                        payload);
                }

                chatMessageRepository.saveAll(pendingMessages);
        }

        // ==================== EDIT MESSAGE ====================
        @Transactional
        public ChatMessageResponse editMessage(Long userId, Long messageId, String newContent) {
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

                // Only sender can edit
                if (!message.getSender().getId().equals(userId)) {
                        throw new AccessDeniedException("You can only edit your own messages");
                }

                // Cannot edit deleted messages
                if (message.isDeletedForSender() || message.isDeletedForReceiver()) {
                        throw new AccessDeniedException("Cannot edit deleted message");
                }

                message.setContent(newContent);
                message.setEditedAt(Instant.now(clock));
                chatMessageRepository.save(message);

                ChatMessageResponse response = toResponse(message);

                // Broadcast to both users
                broadcastToBoth(message.getSender().getId(), message.getRecipient().getId(), response);

                return response;
        }

        // ==================== DELETE MESSAGE ====================
        @Transactional
        public ChatMessageResponse deleteMessage(Long userId, Long messageId, String mode) {
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

                boolean isSender = message.getSender().getId().equals(userId);
                boolean isRecipient = message.getRecipient().getId().equals(userId);

                if (!isSender && !isRecipient) {
                        throw new AccessDeniedException("You can only delete your own messages");
                }

                if ("BOTH".equals(mode)) {
                        // Only sender can delete for both
                        if (!isSender) {
                                throw new AccessDeniedException("Only sender can delete for both");
                        }
                        message.setDeletedGlobally(true);
                } else {
                        // Delete for self only (SELF mode)
                        if (isSender) {
                                message.setDeletedForSender(true);
                        } else {
                                message.setDeletedForReceiver(true);
                        }
                }

                chatMessageRepository.save(message);
                ChatMessageResponse response = toResponse(message);

                // Broadcast to both users if BOTH mode, otherwise just to the deleting user
                if ("BOTH".equals(mode)) {
                        broadcastToBoth(message.getSender().getId(), message.getRecipient().getId(), response);
                } else {
                        messagingTemplate.convertAndSendToUser(
                                        String.valueOf(userId),
                                        "/queue/messages",
                                        response);
                }

                return response;
        }

        // ==================== CLEAR CHAT ====================
        @Transactional
        public void clearChat(Long userId, Long friendId) {
                // Fetch all messages involving both users
                List<ChatMessage> messages = chatMessageRepository
                                .findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderBySentAtAsc(
                                                userId, friendId, friendId, userId);

                boolean anyUpdated = false;
                for (ChatMessage msg : messages) {
                        boolean isSender = msg.getSender().getId().equals(userId);

                        // Soft delete based on role
                        if (isSender) {
                                if (!msg.isDeletedForSender()) {
                                        msg.setDeletedForSender(true);
                                        anyUpdated = true;
                                }
                        } else {
                                if (!msg.isDeletedForReceiver()) {
                                        msg.setDeletedForReceiver(true);
                                        anyUpdated = true;
                                }
                        }
                }

                if (anyUpdated) {
                        chatMessageRepository.saveAll(messages);
                }
        }

        // ==================== GET HISTORY ====================
        @Transactional(readOnly = true)
        public List<ChatMessageResponse> getChatHistory(Long userId, Long otherUserId) {

                if (!userRepository.existsById(otherUserId)) {
                        throw new ResourceNotFoundException("User not found");
                }

                // Verify Friendship (Bypass for Admins)
                User u1 = userId < otherUserId ? userRepository.getReferenceById(userId)
                                : userRepository.getReferenceById(otherUserId);
                User u2 = userId < otherUserId ? userRepository.getReferenceById(otherUserId)
                                : userRepository.getReferenceById(userId);

                boolean isAdminInvolved = false;
                // We need actual User objects to check roles, not references (proxies)
                // Since repositories were used to get references, we might need to fetch them
                // if we want to check roles.
                // However, optimization: check if the 'userId' (current user) is admin.
                User currentUser = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                // Also check other user role just in case
                User otherUser = userRepository.findById(otherUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                if (currentUser.getRole() == com.Project.Continuum.enums.UserRole.ADMIN ||
                                otherUser.getRole() == com.Project.Continuum.enums.UserRole.ADMIN) {
                        isAdminInvolved = true;
                }

                if (!isAdminInvolved && !friendRepository.existsByUser1_IdAndUser2_IdAndStatus(u1.getId(), u2.getId(),
                                com.Project.Continuum.enums.FriendStatus.ACCEPTED)) {
                        throw new AccessDeniedException("You can only view chat history with friends.");
                }

                return chatMessageRepository.findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderBySentAtAsc(
                                userId, otherUserId, otherUserId, userId).stream()
                                .filter(msg -> {
                                        // Filter out messages deleted for this user

                                        // 1. If deleted globally, always SHOW (as tombstone)
                                        if (msg.isDeletedGlobally())
                                                return true;

                                        // 2. Otherwise check individual deletes
                                        boolean isSender = msg.getSender().getId().equals(userId);
                                        if (isSender && msg.isDeletedForSender())
                                                return false;
                                        if (!isSender && msg.isDeletedForReceiver())
                                                return false;
                                        return true;
                                })
                                .map(this::toResponse)
                                .toList();
        }

        // ==================== HELPER METHODS ====================
        private void verifyFriendship(User sender, User recipient) {
                // Admins can chat with anyone
                if (sender.getRole() == com.Project.Continuum.enums.UserRole.ADMIN ||
                                recipient.getRole() == com.Project.Continuum.enums.UserRole.ADMIN) {
                        return;
                }

                User u1 = sender.getId() < recipient.getId() ? sender : recipient;
                User u2 = sender.getId() < recipient.getId() ? recipient : sender;

                if (!friendRepository.existsByUser1_IdAndUser2_IdAndStatus(u1.getId(), u2.getId(),
                                com.Project.Continuum.enums.FriendStatus.ACCEPTED)) {
                        throw new AccessDeniedException("You can only chat with friends (Request Accepted)");
                }
        }

        private void broadcastToBoth(Long senderId, Long recipientId, ChatMessageResponse response) {
                messagingTemplate.convertAndSendToUser(
                                String.valueOf(recipientId),
                                "/queue/messages",
                                response);
                messagingTemplate.convertAndSendToUser(
                                String.valueOf(senderId),
                                "/queue/messages",
                                response);
        }

        private ChatMessageResponse toResponse(ChatMessage msg) {
                Long replyToId = null;
                String replyToContent = null;
                String replyToSenderName = null;

                if (msg.getReplyTo() != null) {
                        replyToId = msg.getReplyTo().getId();
                        replyToContent = msg.getReplyTo().getContent();
                        replyToSenderName = msg.getReplyTo().getSender().getName();
                }

                return new ChatMessageResponse(
                                msg.getId(),
                                msg.getSender().getId(),
                                msg.getRecipient().getId(),
                                msg.isDeletedGlobally() ? "This message was deleted" : msg.getContent(), // Mask content
                                                                                                         // here
                                msg.getSentAt(),
                                msg.getEditedAt(),
                                msg.isDeletedForSender(),
                                msg.isDeletedForReceiver(),
                                msg.isDeletedGlobally(),
                                msg.getDeliveredAt(),
                                msg.getSeenAt(),
                                replyToId,
                                replyToContent,
                                replyToSenderName);
        }
}
