package com.Project.Continuum.controller;

import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.AdminMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SupportController {

    private final AdminMessageService adminMessageService;

    public SupportController(AdminMessageService adminMessageService) {
        this.adminMessageService = adminMessageService;
    }

    record SupportRequest(String subject, String message) {
    }

    record ReportRequest(String subject, String message, String relatedEntityType, Long relatedEntityId) {
    }

    @PostMapping("/support")
    public ResponseEntity<Void> sendSupport(@RequestBody SupportRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        adminMessageService.createSupportRequest(userId, request.subject(), request.message());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report")
    public ResponseEntity<Void> sendReport(@RequestBody ReportRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        adminMessageService.createReport(userId, request.subject(), request.message(),
                request.relatedEntityType(), request.relatedEntityId());
        return ResponseEntity.ok().build();
    }
}
