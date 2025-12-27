package com.Project.Continuum.controller;

import com.Project.Continuum.dto.exchange.ExchangeSessionResponse;
import com.Project.Continuum.enums.ExchangeIntent;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.ExchangeSessionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class ExchangeSessionController {

    private final ExchangeSessionService sessionService;

    public ExchangeSessionController(
            ExchangeSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ExchangeSessionResponse startSession(
            @RequestParam Long requestId,
            @RequestParam ExchangeIntent intent) {

        Long userId = SecurityUtils.getCurrentUserId();
        return sessionService.startSession(requestId, userId, intent);
    }

    @PostMapping("/{sessionId}/accept")
    public ExchangeSessionResponse acceptSession(
            @PathVariable Long sessionId) {

        Long userId = SecurityUtils.getCurrentUserId();
        return sessionService.acceptSession(sessionId, userId);
    }

    @PostMapping("/{sessionId}/activate")
    public ExchangeSessionResponse activateSession(
            @PathVariable Long sessionId) {

        Long userId = SecurityUtils.getCurrentUserId();
        return sessionService.activateSession(sessionId, userId);
    }

    @PostMapping("/{sessionId}/end")
    public ExchangeSessionResponse endSession(
            @PathVariable Long sessionId) {

        Long userId = SecurityUtils.getCurrentUserId();
        return sessionService.endSession(sessionId, userId);
    }
}
