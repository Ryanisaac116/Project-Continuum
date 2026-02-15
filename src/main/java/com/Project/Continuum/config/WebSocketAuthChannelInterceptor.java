package com.Project.Continuum.config;

import com.Project.Continuum.security.JwtUtil;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * WebSocket Channel Interceptor - Handles JWT authentication for STOMP
 * messages.
 * 
 * Extracts JWT from STOMP CONNECT headers and sets Principal for the session.
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final com.Project.Continuum.repository.UserRepository userRepository;

    public WebSocketAuthChannelInterceptor(JwtUtil jwtUtil,
            com.Project.Continuum.repository.UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");

            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);

                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    try {
                        Long userId = jwtUtil.extractUserId(token);
                        String jwtSessionToken = jwtUtil.extractSessionToken(token);

                        if (userId != null) {
                            var userOpt = userRepository.findById(userId);
                            if (userOpt.isEmpty() || !userOpt.get().isActive()) {
                                return message;
                            }

                            if (jwtSessionToken == null) {
                                return message;
                            }

                            String dbSessionToken = userOpt.get().getSessionToken();
                            if (dbSessionToken == null || !dbSessionToken.equals(jwtSessionToken)) {
                                System.err.println("[WebSocketAuth] Session token mismatch for user " + userId);
                                return message; // Invalid session, treat as unauthenticated
                            }

                            // Create authorities based on role
                            List<org.springframework.security.core.GrantedAuthority> authorities = Collections
                                    .singletonList(
                                            new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                                    "ROLE_" + userOpt.get().getRole().name()));

                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    authorities);
                            accessor.setUser(authentication);
                        }
                    } catch (Exception e) {
                        // Invalid token - connection will fail without auth
                        System.err.println("[WebSocketAuth] Invalid token: " + e.getMessage());
                    }
                }
            }
        } else if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/admin")) {
                var user = accessor.getUser();
                if (!(user instanceof org.springframework.security.core.Authentication auth) ||
                        !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                    throw new IllegalArgumentException("Access Denied: Admin role required for " + destination);
                }
            }
        }
        return message;
    }
}
