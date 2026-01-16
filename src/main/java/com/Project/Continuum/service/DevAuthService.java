package com.Project.Continuum.service;

import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.AuthProvider;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.security.JwtUtil;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Find existing user by (provider, providerId)
        // Note: You might need to add a findByAuthProviderAndProviderUserId method to
        // UserRepository if not present
        // Or assume userId passed in IS the DB ID?
        // The requirement says: "If user does NOT exist: Create user".
        // This implies we look up by the "identity", which in DEV mode is just the ID
        // we pass?
        // Wait, if I pass userId 123, is that the PK or just a number?
        // User prompt says: "Accepts { userId: 123 }" -> "providerId = dev_123".
        // So we should lookup by providerId.

        return userRepository.findByAuthProviderAndProviderUserId(AuthProvider.DEV, providerId)
                .map(user -> jwtUtil.generateToken(user.getId()))
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName("Dev User " + userId);
                    newUser.setAuthProvider(AuthProvider.DEV);
                    newUser.setProviderUserId(providerId);
                    newUser.setActive(true);
                    newUser = userRepository.save(newUser);
                    return jwtUtil.generateToken(newUser.getId());
                });
    }
}
