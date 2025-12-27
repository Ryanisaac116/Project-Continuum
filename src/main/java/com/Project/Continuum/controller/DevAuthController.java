package com.Project.Continuum.controller;

import com.Project.Continuum.dto.auth.LoginResponse;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.security.JwtUtil;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;


// DEV AUTH ONLY
// DELETE THIS CONTROLLER WHEN GOOGLE LOGIN IS IMPLEMENTED

@RestController
@RequestMapping("/dev/auth")
@Profile("dev")
public class DevAuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public DevAuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login/{userId}")
    public LoginResponse login(@PathVariable Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->  new ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(userId);
        return new LoginResponse(userId, token);
    }
}
