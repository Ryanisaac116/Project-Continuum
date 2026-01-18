package com.Project.Continuum.controller;

import com.Project.Continuum.service.GoogleAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Profile({ "prod", "dev" })
public class AuthController {

    private final GoogleAuthService googleAuthService;

    public AuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @Value("${spring.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/google")
    public ResponseEntity<?> googleLogin() {
        String authUrl = googleAuthService.generateAuthorizationUrl();
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", authUrl)
                .build();
    }

    @GetMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestParam String code) {
        try {
            String token = googleAuthService.processCallback(code);
            // Redirect to frontend with token
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/auth/success?token=" + token)
                    .build();
        } catch (Exception e) {
            // Redirect to frontend with error parameter
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", frontendUrl + "/login?error=true")
                    .build();
        }
    }

}
