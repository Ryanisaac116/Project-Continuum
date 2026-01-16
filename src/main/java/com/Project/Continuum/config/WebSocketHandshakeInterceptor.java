package com.Project.Continuum.config;

import com.Project.Continuum.security.JwtUtil;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Collections;
import java.util.Map;

/**
 * WebSocket Handshake Interceptor - Extracts JWT from query parameter during
 * handshake.
 * 
 * The token is passed as ?token=xxx in the WebSocket URL.
 * This interceptor extracts it and stores userId in session attributes,
 * making it available for the Principal in STOMP messages.
 */
@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;
    private final com.Project.Continuum.repository.UserRepository userRepository;

    public WebSocketHandshakeInterceptor(JwtUtil jwtUtil,
            com.Project.Continuum.repository.UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes) throws Exception {

        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            String token = servletRequest.getServletRequest().getParameter("token");

            if (token != null && !token.isEmpty()) {
                try {
                    Long userId = jwtUtil.extractUserId(token);
                    String jwtSessionToken = jwtUtil.extractSessionToken(token);

                    if (userId != null) {
                        // One-Device Login Check
                        if (jwtSessionToken != null) {
                            var userOpt = userRepository.findById(userId);
                            if (userOpt.isPresent()) {
                                String dbSessionToken = userOpt.get().getSessionToken();
                                if (dbSessionToken == null || !dbSessionToken.equals(jwtSessionToken)) {
                                    System.err.println("[WebSocketHandshake] Session mismatch for user " + userId
                                            + ". Rejecting.");
                                    response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                                    return false;
                                }
                            }
                        }

                        // Store userId in session attributes for later use
                        attributes.put("userId", userId);

                        // Create authentication token
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.emptyList());
                        attributes.put("simpUser", auth);

                        System.out.println("[WebSocketHandshake] Authenticated user: " + userId);
                        return true;
                    }
                } catch (Exception e) {
                    System.err.println("[WebSocketHandshake] Token validation failed: " + e.getMessage());
                }
            }
        }

        // Allow connection but without authentication
        // (will fail on protected operations)
        System.out.println("[WebSocketHandshake] No valid token, allowing unauthenticated connection");
        return true;
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @Nullable Exception exception) {
        // No action needed after handshake
    }
}
