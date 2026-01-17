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
import java.util.Map;

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

    // REST: Edit Message
    @PatchMapping("/api/chat/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        String content = body.get("content");
        return ResponseEntity.ok(chatService.editMessage(userId, messageId, content));
    }

    // REST: Delete Message
    @DeleteMapping("/api/chat/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam(defaultValue = "SELF") String mode) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.deleteMessage(userId, messageId, mode));
    }

    // REST: Mark Messages as Seen
    @PostMapping("/api/chat/messages/seen")
    public ResponseEntity<Void> markMessagesAsSeen(@RequestBody Map<String, List<Long>> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<Long> messageIds = body.get("messageIds");
        chatService.markMessagesAsSeen(userId, messageIds);
        return ResponseEntity.ok().build();
    }

    // WebSocket: Send Message
    // Client sends to: /app/chat
    @MessageMapping("/chat")
    public void sendMessage(
            @Payload @Valid ChatMessageRequest request,
            Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated WebSocket message");
        }

        Long senderId = Long.valueOf(principal.getName());
        chatService.sendMessage(senderId, request);
    }
}
