package com.Project.Continuum.scheduler;

import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PresenceScheduler {

    private final UserRepository userRepository;
    private final com.Project.Continuum.service.PresenceService presenceService;

    public PresenceScheduler(UserRepository userRepository,
            com.Project.Continuum.service.PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    // runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void markInactiveUsersOffline() {

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);

        userRepository
                .findUsersToMarkOffline(cutoff)
                .forEach(user -> presenceService.updatePresence(user.getId(), PresenceStatus.OFFLINE));
    }
}
