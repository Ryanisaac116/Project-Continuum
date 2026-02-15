package com.Project.Continuum.service;

import com.Project.Continuum.entity.AdminMessage;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.AdminMessageStatus;
import com.Project.Continuum.enums.AdminMessageType;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.AdminMessageRepository;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminMessageService {

    private final AdminMessageRepository adminMessageRepository;
    private final UserRepository userRepository;
    private final org.springframework.messaging.simp.SimpMessageSendingOperations messagingTemplate;

    public AdminMessageService(AdminMessageRepository adminMessageRepository, UserRepository userRepository,
            org.springframework.messaging.simp.SimpMessageSendingOperations messagingTemplate) {
        this.adminMessageRepository = adminMessageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void createSupportRequest(Long senderId, String subject, String message) {
        createMessage(senderId, AdminMessageType.SUPPORT, subject, message, null, null);
    }

    public void createReport(Long senderId, String subject, String message, String relatedType, Long relatedId) {
        createMessage(senderId, AdminMessageType.REPORT, subject, message, relatedType, relatedId);
    }

    private void createMessage(Long senderId, AdminMessageType type, String subject, String message, String relatedType,
            Long relatedId) {
        if (senderId == null) {
            throw new IllegalArgumentException("Sender ID cannot be null");
        }
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AdminMessage adminMessage = new AdminMessage();
        adminMessage.setSender(sender);
        adminMessage.setType(type);
        adminMessage.setSubject(subject);
        adminMessage.setMessage(message);
        adminMessage.setRelatedEntityType(relatedType);
        adminMessage.setRelatedEntityId(relatedId);
        adminMessage.setStatus(AdminMessageStatus.OPEN);

        AdminMessage savedMessage = adminMessageRepository.save(adminMessage);

        // Map to DTO to avoid serialization issues with Entity/Hibernate proxies
        com.Project.Continuum.dto.AdminMessageDTO.SenderDTO senderDTO = new com.Project.Continuum.dto.AdminMessageDTO.SenderDTO(
                savedMessage.getSender().getId(),
                savedMessage.getSender().getName(),
                savedMessage.getSender().getProfileImageUrl());

        com.Project.Continuum.dto.AdminMessageDTO messageDTO = new com.Project.Continuum.dto.AdminMessageDTO(
                savedMessage.getId(),
                senderDTO,
                savedMessage.getType(),
                savedMessage.getSubject(),
                savedMessage.getMessage(),
                savedMessage.getRelatedEntityType(),
                savedMessage.getRelatedEntityId(),
                savedMessage.getStatus(),
                savedMessage.getCreatedAt());

        // Broadcast to admins via WebSocket
        messagingTemplate.convertAndSend("/topic/admin/messages", messageDTO);
    }

    // Admin Operations

    @Transactional(readOnly = true)
    public Page<AdminMessage> getMessages(Pageable pageable) {
        return adminMessageRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public void resolveMessage(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Message ID cannot be null");
        }
        AdminMessage msg = adminMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        msg.setStatus(AdminMessageStatus.RESOLVED);
        adminMessageRepository.save(msg);
    }
}
