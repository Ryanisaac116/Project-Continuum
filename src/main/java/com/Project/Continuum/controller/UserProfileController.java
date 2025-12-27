package com.Project.Continuum.controller;

import com.Project.Continuum.dto.profile.UserProfileResponse;
import com.Project.Continuum.dto.profile.UserProfileUpdateRequest;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.UserProfileService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserProfileResponse getProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        return profileService.getProfile(userId);
    }

    @PutMapping
    public UserProfileResponse updateProfile(
            @RequestBody UserProfileUpdateRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return profileService.updateProfile(userId, request);
    }
}
