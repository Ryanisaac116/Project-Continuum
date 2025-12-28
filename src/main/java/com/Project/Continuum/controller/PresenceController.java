package com.Project.Continuum.controller;

import com.Project.Continuum.dto.presence.PresenceResponse;
import com.Project.Continuum.dto.presence.PresenceUpdateRequest;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.PresenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @PatchMapping
    public ResponseEntity<PresenceResponse> updatePresence(
            @Valid @RequestBody PresenceUpdateRequest request
    ) {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        Long userId = Long.valueOf(authentication.getName());

        return ResponseEntity.ok(
                presenceService.updatePresence(userId, request.getStatus())
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PresenceResponse> getPresence(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                presenceService.getPresence(userId)
        );
    }

    @PostMapping("/heartbeat")
    public void heartbeat() {
        Long userId = SecurityUtils.getCurrentUserId();
        presenceService.heartbeat(userId);
    }

}
