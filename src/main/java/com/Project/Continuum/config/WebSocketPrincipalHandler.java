package com.Project.Continuum.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

/**
 * Custom Handshake Handler - Determines the Principal (user identity) for
 * WebSocket sessions.
 * 
 * Uses the userId stored in session attributes (from HandshakeInterceptor) to
 * create the Principal.
 */
@Component
public class WebSocketPrincipalHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            @NonNull ServerHttpRequest request,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes) {

        Long userId = (Long) attributes.get("userId");

        if (userId != null) {
            // Create authentication with userId as principal name
            return new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    Collections.emptyList()) {
                @Override
                public String getName() {
                    // Return userId as string - this is what STOMP uses for user destinations
                    return userId.toString();
                }
            };
        }

        // No authenticated user
        return null;
    }
}
