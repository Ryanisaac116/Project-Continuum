package com.Project.Continuum.controller;

import com.Project.Continuum.service.GoogleAuthService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Profile("prod")
public class AuthController {

    private final GoogleAuthService googleAuthService;

    public AuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @org.springframework.beans.factory.annotation.Value("${spring.frontend-url}")
    private String frontendUrl;

    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestParam String code) {
        String token = googleAuthService.processCallback(code);

        // Redirect to frontend with token
        return ResponseEntity.status(302)
                .header("Location", frontendUrl + "/auth/success?token=" + token)
                .build();
    }
}
