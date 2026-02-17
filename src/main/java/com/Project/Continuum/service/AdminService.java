package com.Project.Continuum.service;

import com.Project.Continuum.dto.admin.DashboardStatsResponse;
import com.Project.Continuum.dto.admin.AdminUserResponse;
import com.Project.Continuum.dto.admin.UserActivityResponse;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.repository.SkillExchangeRequestRepository;
import com.Project.Continuum.repository.ChatMessageRepository;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.UserSkillRepository;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.enums.FriendStatus;
import com.Project.Continuum.enums.SkillType;
import com.Project.Continuum.enums.ExchangeStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class AdminService {

        private final UserRepository userRepository;
        private final SkillExchangeRequestRepository skillExchangeRequestRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final FriendRepository friendRepository;
        private final UserSkillRepository userSkillRepository;
        private final ExchangeSessionRepository exchangeSessionRepository;

        public AdminService(
                        UserRepository userRepository,
                        SkillExchangeRequestRepository skillExchangeRequestRepository,
                        ChatMessageRepository chatMessageRepository,
                        FriendRepository friendRepository,
                        UserSkillRepository userSkillRepository,
                        ExchangeSessionRepository exchangeSessionRepository) {
                this.userRepository = userRepository;
                this.skillExchangeRequestRepository = skillExchangeRequestRepository;
                this.chatMessageRepository = chatMessageRepository;
                this.friendRepository = friendRepository;
                this.userSkillRepository = userSkillRepository;
                this.exchangeSessionRepository = exchangeSessionRepository;
        }

        public DashboardStatsResponse getDashboardStats() {
                long totalUsers = userRepository.count();
                long activeUsers = userRepository.countByLastSeenAtAfter(Instant.now().minus(24, ChronoUnit.HOURS));
                long totalExchangeRequests = skillExchangeRequestRepository.count();
                long totalMessages = chatMessageRepository.count();
                long completedSessions = exchangeSessionRepository.countByStatus(ExchangeStatus.COMPLETED);
                long teachingSkills = userSkillRepository.countBySkillType(SkillType.TEACH);
                long learningSkills = userSkillRepository.countBySkillType(SkillType.LEARN);

                return new DashboardStatsResponse(
                                totalUsers,
                                activeUsers,
                                totalExchangeRequests,
                                totalMessages,
                                completedSessions,
                                teachingSkills,
                                learningSkills);
        }

        public Page<AdminUserResponse> getUsers(Pageable pageable) {
                return userRepository.findByRoleNot(com.Project.Continuum.enums.UserRole.ADMIN, pageable)
                                .map(this::toAdminUserResponse);
        }

        public void deactivateUser(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                user.setActive(false);
                user.setPresenceStatus(PresenceStatus.OFFLINE);
                user.setLastSeenAt(Instant.now());
                userRepository.save(user);
        }

        public void reactivateUser(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                user.setActive(true);
                // Clear suspension fields for Phase 2 audit compatibility
                user.setPresenceStatus(PresenceStatus.OFFLINE);
                userRepository.save(user);
        }

        public UserActivityResponse getUserActivity(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                return new UserActivityResponse(
                                user.getCreatedAt(),
                                user.getLastSeenAt(),
                                chatMessageRepository.countBySender(user),
                                friendRepository.countByUserIdAndStatus(userId, FriendStatus.ACCEPTED),
                                userSkillRepository.countByUser_IdAndSkillType(userId, SkillType.TEACH),
                                userSkillRepository.countByUser_IdAndSkillType(userId, SkillType.LEARN),
                                exchangeSessionRepository.countByUserIdAndStatus(userId, ExchangeStatus.COMPLETED),
                                List.of());
        }

        private AdminUserResponse toAdminUserResponse(User user) {
                return new AdminUserResponse(
                                user.getId(),
                                user.getName(),
                                user.getRole() != null ? user.getRole().name() : "UNKNOWN",
                                user.isActive(),
                                user.getPresenceStatus() != null ? user.getPresenceStatus().name() : "OFFLINE",
                                user.getCreatedAt(),
                                user.getLastSeenAt());
        }
}
