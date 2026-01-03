package com.Project.Continuum.service;

import com.Project.Continuum.dto.presence.PresenceResponse;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PresenceService {

    private final UserRepository userRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public PresenceService(UserRepository userRepository,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public PresenceResponse updatePresence(Long userId, PresenceStatus status) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        user.setPresenceStatus(status);

        PresenceResponse response = new PresenceResponse(user.getId(), user.getPresenceStatus(), user.getLastSeenAt());
        messagingTemplate.convertAndSend("/topic/presence/" + userId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public PresenceResponse getPresence(Long userId) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        return new PresenceResponse(user.getId(), user.getPresenceStatus(), user.getLastSeenAt());
    }

    @Transactional
    public void heartbeat(Long userId) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        user.setLastSeenAt(LocalDateTime.now());

        // if user was OFFLINE but app is alive again
        if (user.getPresenceStatus() == PresenceStatus.OFFLINE) {
            user.setPresenceStatus(PresenceStatus.ONLINE);

            PresenceResponse response = new PresenceResponse(user.getId(), user.getPresenceStatus(),
                    user.getLastSeenAt());
            messagingTemplate.convertAndSend("/topic/presence/" + userId, response);
        }
    }

}
