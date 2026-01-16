package com.Project.Continuum.controller;

import com.Project.Continuum.enums.MatchIntent;
import com.Project.Continuum.matching.*;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.MatchingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @PostMapping("/join")
    public MatchDecision findMatch(
            @RequestBody com.Project.Continuum.dto.MatchingRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return matchingService.findMatch(userId, request);
    }
}
