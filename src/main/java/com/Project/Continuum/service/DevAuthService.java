package com.Project.Continuum.service;

import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.AuthProvider;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.security.JwtUtil;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Profile("dev")
public class DevAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public DevAuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public String login(Long userId) {
        String providerId = "dev_" + userId;
        String sessionToken = UUID.randomUUID().toString();

        return userRepository.findByAuthProviderAndProviderUserId(AuthProvider.DEV, providerId)
                .map(user -> {
                    if (!user.isActive()) {
                        throw new BadRequestException("Account is deactivated");
                    }
                    user.setSessionToken(sessionToken);
                    userRepository.save(user);
                    return jwtUtil.generateToken(user.getId(), sessionToken);
                })
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName("Dev User " + userId);
                    newUser.setAuthProvider(AuthProvider.DEV);
                    newUser.setProviderUserId(providerId);
                    newUser.setActive(true);
                    newUser.setSessionToken(sessionToken);
                    newUser = userRepository.save(newUser);
                    return jwtUtil.generateToken(newUser.getId(), sessionToken);
                });
    }
}
