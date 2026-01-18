package com.Project.Continuum.service;

import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.AuthProvider;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
@Profile({ "prod", "dev" })
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    public GoogleAuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.restTemplate = new RestTemplate();
    }

    public String generateAuthorizationUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&response_type=code" +
                "&scope=openid%20email%20profile" +
                "&access_type=offline" +
                "&prompt=consent";
    }

    public String processCallback(String code) {
        // 1. Exchange code for Access Token
        String accessToken = exchangeCodeForToken(code);

        // 2. Fetch User Info
        JsonNode googleUser = fetchGoogleUserInfo(accessToken);

        // 3. Extract Identity
        String providerUserId = googleUser.get("sub").asText();
        String email = googleUser.get("email").asText();
        String name = googleUser.has("name") ? googleUser.get("name").asText() : email;
        String pictureUrl = googleUser.has("picture") ? googleUser.get("picture").asText() : null;

        // 4. Sync User
        User user = syncUser(providerUserId, name, email, pictureUrl);

        // 5. Issue JWT
        return jwtUtil.generateToken(user.getId());
    }

    private String exchangeCodeForToken(String code) {
        String tokenEndpoint = "https://oauth2.googleapis.com/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(tokenEndpoint, request, JsonNode.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().get("access_token").asText();
            }
        } catch (Exception e) {
            log.error("Failed to exchange code for token", e);
            throw new RuntimeException("Google OAuth token exchange failed");
        }
        throw new RuntimeException("Empty response from Google Token Endpoint");
    }

    private JsonNode fetchGoogleUserInfo(String accessToken) {
        String userInfoEndpoint = "https://www.googleapis.com/oauth2/v3/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    userInfoEndpoint, HttpMethod.GET, request, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch Google user info", e);
            throw new RuntimeException("Google User Info fetch failed");
        }
        throw new RuntimeException("Empty response from Google User Info Endpoint");
    }

    private User syncUser(String providerUserId, String name, String email, String pictureUrl) {
        Optional<User> existing = userRepository.findByAuthProviderAndProviderUserId(AuthProvider.GOOGLE,
                providerUserId);

        if (existing.isPresent()) {
            User user = existing.get();
            boolean updated = false;

            if (!user.getName().equals(name)) {
                user.setName(name);
                updated = true;
            }

            // Only update profile image if currently null
            if (user.getProfileImageUrl() == null && pictureUrl != null) {
                user.setProfileImageUrl(pictureUrl);
                updated = true;
            }

            if (updated) {
                return userRepository.save(user);
            }
            return user;
        }

        // New User
        User newUser = new User();
        newUser.setName(name);
        newUser.setAuthProvider(AuthProvider.GOOGLE);
        newUser.setProviderUserId(providerUserId);
        newUser.setBio("Joined via Google");
        newUser.setPresenceStatus(PresenceStatus.ONLINE);
        newUser.setProfileImageUrl(pictureUrl);

        return userRepository.save(newUser);
    }
}
