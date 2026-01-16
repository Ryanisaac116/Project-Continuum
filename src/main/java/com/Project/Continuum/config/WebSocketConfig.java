package com.Project.Continuum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration - Enables STOMP messaging over WebSocket.
 * 
 * Authentication flow:
 * 1. HandshakeInterceptor extracts JWT from ?token query param
 * 2. PrincipalHandler sets the userId as Principal
 * 3. ChannelInterceptor validates JWT in STOMP CONNECT headers (fallback)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authInterceptor;
    private final WebSocketHandshakeInterceptor handshakeInterceptor;
    private final WebSocketPrincipalHandler principalHandler;

    public WebSocketConfig(
            WebSocketAuthChannelInterceptor authInterceptor,
            WebSocketHandshakeInterceptor handshakeInterceptor,
            WebSocketPrincipalHandler principalHandler) {
        this.authInterceptor = authInterceptor;
        this.handshakeInterceptor = handshakeInterceptor;
        this.principalHandler = principalHandler;
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable simple broker for subscriptions to /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");

        // Messages from client should be prefixed with /app
        config.setApplicationDestinationPrefixes("/app");

        // User-specific messages use /user prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Native WebSocket endpoint with authentication
        registry.addEndpoint("/ws")
                .addInterceptors(handshakeInterceptor)
                .setHandshakeHandler(principalHandler)
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        // Register auth interceptor for STOMP CONNECT header validation
        registration.interceptors(authInterceptor);
    }
}
