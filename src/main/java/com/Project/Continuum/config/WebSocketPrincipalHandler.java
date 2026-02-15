package com.Project.Continuum.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Custom Handshake Handler - Determines the Principal (user identity) for
 * WebSocket sessions.
 * 
 * Uses the authentication stored in session attributes (from
 * HandshakeInterceptor)
 * which includes the user's role authorities. This is critical for role-based
 * topic subscriptions (e.g., /topic/admin/*).
 */
@Component
public class WebSocketPrincipalHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            @NonNull ServerHttpRequest request,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes) {

        // Use the auth token created by WebSocketHandshakeInterceptor,
        // which includes the user's role authorities (e.g., ROLE_ADMIN).
        // This is critical: without role authorities, the channel interceptor
        // will reject subscriptions to /topic/admin/* destinations.
        Object simpUser = attributes.get("simpUser");
        if (simpUser instanceof UsernamePasswordAuthenticationToken auth) {
            // Wrap to override getName() for STOMP user destinations
            Long userId = (Long) auth.getPrincipal();
            return new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    auth.getAuthorities()) { // Preserve the role authorities!
                @Override
                public String getName() {
                    return userId.toString();
                }
            };
        }

        // Fallback: check for userId in attributes
        Long userId = (Long) attributes.get("userId");
        if (userId != null) {
            return new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    java.util.Collections.emptyList()) {
                @Override
                public String getName() {
                    return userId.toString();
                }
            };
        }

        // No authenticated user
        return null;
    }
}
