package com.Project.Continuum.controller;

import com.Project.Continuum.dto.AdminMessageDTO;
import com.Project.Continuum.entity.AdminMessage;
import com.Project.Continuum.service.AdminMessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/messages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMessageController {

    private final AdminMessageService adminMessageService;

    public AdminMessageController(AdminMessageService adminMessageService) {
        this.adminMessageService = adminMessageService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminMessageDTO>> getMessages(@PageableDefault(size = 20) Pageable pageable) {
        Page<AdminMessage> messages = adminMessageService.getMessages(pageable);
        return ResponseEntity.ok(messages.map(this::toDTO));
    }

    private AdminMessageDTO toDTO(AdminMessage msg) {
        return new AdminMessageDTO(
                msg.getId(),
                new AdminMessageDTO.SenderDTO(
                        msg.getSender().getId(),
                        msg.getSender().getName(),
                        msg.getSender().getProfileImageUrl()),
                msg.getType(),
                msg.getSubject(),
                msg.getMessage(),
                msg.getRelatedEntityType(),
                msg.getRelatedEntityId(),
                msg.getStatus(),
                msg.getCreatedAt());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveMessage(@PathVariable Long id) {
        adminMessageService.resolveMessage(id);
        return ResponseEntity.ok().build();
    }
}
