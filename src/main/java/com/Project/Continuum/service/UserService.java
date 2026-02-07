package com.Project.Continuum.service;

import com.Project.Continuum.dto.users.UserResponse;
import com.Project.Continuum.dto.users.UserUpdateRequest;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.CallSessionRepository;
import com.Project.Continuum.repository.ChatMessageRepository;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.NotificationRepository;
import com.Project.Continuum.repository.PushSubscriptionRepository;
import com.Project.Continuum.repository.SkillExchangeRequestRepository;
import com.Project.Continuum.repository.UserProfileRepository;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillExchangeRequestRepository exchangeRequestRepository;
    private final ExchangeSessionRepository exchangeSessionRepository;
    private final CallSessionRepository callSessionRepository;
    private final FriendRepository friendRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;

    public UserService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserSkillRepository userSkillRepository,
            SkillExchangeRequestRepository exchangeRequestRepository,
            ExchangeSessionRepository exchangeSessionRepository,
            CallSessionRepository callSessionRepository,
            FriendRepository friendRepository,
            ChatMessageRepository chatMessageRepository,
            NotificationRepository notificationRepository,
            PushSubscriptionRepository pushSubscriptionRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userSkillRepository = userSkillRepository;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.callSessionRepository = callSessionRepository;
        this.friendRepository = friendRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.notificationRepository = notificationRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapToResponse(user);
    }

    public UserResponse updateUser(Long userId, UserUpdateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setSessionToken(null);
        user.setPresenceStatus(PresenceStatus.OFFLINE);
        user.setLastSeenAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setActive(false);
        user.setSessionToken(null);
        user.setPresenceStatus(PresenceStatus.OFFLINE);
        user.setLastSeenAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Long> messageIds = chatMessageRepository.findIdsByUserId(userId);
        if (!messageIds.isEmpty()) {
            chatMessageRepository.clearReplyReferences(messageIds);
            chatMessageRepository.deleteBySender_IdOrRecipient_Id(userId, userId);
        }

        callSessionRepository.deleteByCaller_IdOrReceiver_Id(userId, userId);
        exchangeSessionRepository.deleteByUserA_IdOrUserB_Id(userId, userId);
        exchangeRequestRepository.deleteBySender_IdOrReceiver_Id(userId, userId);
        friendRepository.deleteByUser1_IdOrUser2_Id(userId, userId);
        notificationRepository.deleteAllByUserId(userId);
        pushSubscriptionRepository.deleteByUserId(userId);
        userProfileRepository.deleteByUser_Id(userId);
        userSkillRepository.deleteByUser_Id(userId);

        userRepository.delete(user);
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getBio(),
                user.getProfileImageUrl(),
                user.getPresenceStatus());
    }
}
