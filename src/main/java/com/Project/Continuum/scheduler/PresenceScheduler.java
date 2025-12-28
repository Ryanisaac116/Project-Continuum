package com.Project.Continuum.scheduler;

import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PresenceScheduler {

    private final UserRepository userRepository;

    public PresenceScheduler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void markInactiveUsersOffline() {

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);

        userRepository
                .findUsersToMarkOffline(cutoff)
                .forEach(user -> user.setPresenceStatus(PresenceStatus.OFFLINE));
    }
}
