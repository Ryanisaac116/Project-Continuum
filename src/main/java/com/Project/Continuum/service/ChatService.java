package com.Project.Continuum.service;

import com.Project.Continuum.dto.chat.ChatMessageRequest;
import com.Project.Continuum.dto.chat.ChatMessageResponse;
import com.Project.Continuum.entity.ChatMessage;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.ChatMessageRepository;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final FriendRepository friendRepository;
        private final SimpMessagingTemplate messagingTemplate;

        public ChatService(ChatMessageRepository chatMessageRepository,
                        UserRepository userRepository,
                        FriendRepository friendRepository,
                        SimpMessagingTemplate messagingTemplate) {
                this.chatMessageRepository = chatMessageRepository;
                this.userRepository = userRepository;
                this.friendRepository = friendRepository;
                this.messagingTemplate = messagingTemplate;
        }

        @Transactional
        public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {

                User sender = userRepository.findById(senderId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

                User recipient = userRepository.findById(request.getRecipientId())
                                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

                // Verify Friendship
                // Use logic similar to FriendService
                User u1 = sender.getId() < recipient.getId() ? sender : recipient;
                User u2 = sender.getId() < recipient.getId() ? recipient : sender;

                if (!friendRepository.existsByUser1_IdAndUser2_IdAndStatus(u1.getId(), u2.getId(),
                                com.Project.Continuum.enums.FriendStatus.ACCEPTED)) {
                        throw new AccessDeniedException("You can only chat with friends (Request Accepted)");
                }

                ChatMessage message = new ChatMessage();
                message.setSender(sender);
                message.setRecipient(recipient);
                message.setContent(request.getContent());
                message.setSentAt(LocalDateTime.now());

                ChatMessage savedMessage = chatMessageRepository.save(message);

                ChatMessageResponse response = new ChatMessageResponse(
                                savedMessage.getId(),
                                savedMessage.getSender().getId(),
                                savedMessage.getRecipient().getId(),
                                savedMessage.getContent(),
                                savedMessage.getSentAt());

                // Broadcast to recipient via Private User Queue
                messagingTemplate.convertAndSendToUser(
                                String.valueOf(recipient.getId()),
                                "/queue/messages",
                                response);

                // Also send back to sender via their private queue so their other devices
                // update?
                // Or just let the caller handle it (REST response or ACK).
                // Usually good to ack on socket too if sender used socket.
                // For simple consistency:
                messagingTemplate.convertAndSendToUser(
                                String.valueOf(sender.getId()),
                                "/queue/messages",
                                response);

                return response;
        }

        @Transactional(readOnly = true)
        public List<ChatMessageResponse> getChatHistory(Long userId, Long otherUserId) {

                // Verify user exists
                if (!userRepository.existsById(otherUserId)) {
                        throw new ResourceNotFoundException("User not found");
                }

                // Verify Friendship for history access per Security Requirements
                User u1 = userId < otherUserId ? userRepository.getReferenceById(userId)
                                : userRepository.getReferenceById(otherUserId);
                User u2 = userId < otherUserId ? userRepository.getReferenceById(otherUserId)
                                : userRepository.getReferenceById(userId);

                if (!friendRepository.existsByUser1_IdAndUser2_IdAndStatus(u1.getId(), u2.getId(),
                                com.Project.Continuum.enums.FriendStatus.ACCEPTED)) {
                        throw new AccessDeniedException("You can only view chat history with friends.");
                }

                return chatMessageRepository.findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderBySentAtAsc(
                                userId, otherUserId,
                                otherUserId, userId).stream()
                                .map(msg -> new ChatMessageResponse(
                                                msg.getId(),
                                                msg.getSender().getId(),
                                                msg.getRecipient().getId(),
                                                msg.getContent(),
                                                msg.getSentAt()))
                                .toList();
        }
}
