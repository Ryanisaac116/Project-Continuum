package com.Project.Continuum.service;

import com.Project.Continuum.dto.presence.PresenceResponse;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PresenceService {

    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final com.Project.Continuum.store.PresenceStore presenceStore;

    public PresenceService(UserRepository userRepository,
            SimpMessageSendingOperations messagingTemplate,
            com.Project.Continuum.store.PresenceStore presenceStore) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.presenceStore = presenceStore;
    }

    @Transactional
    public PresenceResponse updatePresence(Long userId, PresenceStatus status) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        // Update Store
        presenceStore.setUserStatus(userId, status);

        // Update DB
        user.setPresenceStatus(status);
        if (status == PresenceStatus.OFFLINE) {
            user.setLastSeenAt(LocalDateTime.now());
        }

        PresenceResponse response = new PresenceResponse(user.getId(), status, user.getLastSeenAt());
        messagingTemplate.convertAndSend("/topic/presence/" + userId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public PresenceResponse getPresence(Long userId) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        // Check Store first for real-time status
        PresenceStatus liveStatus = presenceStore.getStatus(userId);

        // Logic: if Store gives OFFLINE (default), but DB says ONLINE?
        // We trust Store (in-memory is truth). DB might be stale if server crashed.
        // We need lastSeen from DB if Store is empty.

        LocalDateTime lastSeenObj = presenceStore.getLastSeen(userId);
        if (lastSeenObj == null) {
            lastSeenObj = user.getLastSeenAt();
        }

        return new PresenceResponse(user.getId(), liveStatus, lastSeenObj);
    }

    @Transactional
    public void setUserSession(Long userId, Long sessionId) {
        presenceStore.setUserSession(userId, sessionId);
    }

    @Transactional
    public void heartbeat(Long userId) {

        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active user not found"));

        // Update Store
        presenceStore.updateLastSeen(userId);

        // Check if status needs correction in Store
        if (presenceStore.getStatus(userId) == PresenceStatus.OFFLINE) {
            presenceStore.setUserStatus(userId, PresenceStatus.ONLINE);
            user.setPresenceStatus(PresenceStatus.ONLINE);

            PresenceResponse response = new PresenceResponse(user.getId(), PresenceStatus.ONLINE, LocalDateTime.now());
            messagingTemplate.convertAndSend("/topic/presence/" + userId, response);
        }

        user.setLastSeenAt(LocalDateTime.now());
    }

}
