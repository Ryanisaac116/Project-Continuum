package com.Project.Continuum.controller;

import com.Project.Continuum.dto.chat.ChatMessageRequest;
import com.Project.Continuum.dto.chat.ChatMessageResponse;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // REST: Get History
    @GetMapping("/api/chat/{friendId}")
    public ResponseEntity<List<ChatMessageResponse>> getChatHistory(@PathVariable Long friendId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.getChatHistory(userId, friendId));
    }

    // WebSocket: Send Message
    // Client sends to: /app/chat
    @MessageMapping("/chat")
    public void sendMessage(
            @Payload @Valid ChatMessageRequest request,
            Principal principal) {
        // Principal name is userId (set in JwtAuthenticationFilter & Handshake if
        // configured,
        // but for STOMP over WebSocket, Spring Security integration usually passes the
        // Principal).
        // Note: In JwtAuthenticationFilter we set SecurityContextHolder.
        // We need to ensure ChannelInterceptor transfers it to Stomp Header or rely on
        // it being there
        // if using native WebSocket support.
        // Given the project setup, we might need a custom ChannelInterceptor for JWT in
        // Websocket if not sending cookies.
        // BUT, let's assume standard behavior for now. If principal is null, we'll need
        // to fix config.

        if (principal == null) {
            throw new IllegalStateException("Unauthenticated WebSocket message");
        }

        Long senderId = Long.valueOf(principal.getName());
        chatService.sendMessage(senderId, request);
    }
}
