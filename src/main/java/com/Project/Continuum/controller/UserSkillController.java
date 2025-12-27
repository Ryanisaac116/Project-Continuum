package com.Project.Continuum.controller;


import com.Project.Continuum.dto.userskill.UserSkillCreateRequest;
import com.Project.Continuum.dto.userskill.UserSkillResponse;
import com.Project.Continuum.dto.userskill.UserSkillUpdateRequest;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.UserSkillService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-skills")
public class UserSkillController {

    private final UserSkillService userSkillService;

    public UserSkillController(UserSkillService userSkillService) {
        this.userSkillService = userSkillService;
    }

    @PostMapping
    public UserSkillResponse addSkill(
            @RequestBody UserSkillCreateRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return userSkillService.addSkill(userId, request);
    }

    @GetMapping
    public List<UserSkillResponse> getUserSkills() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userSkillService.getUserSkills(userId);
    }

    @PutMapping("/{userSkillId}")
    public UserSkillResponse updateUserSkill(
            @PathVariable Long userSkillId,
            @RequestBody UserSkillUpdateRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return userSkillService.updateUserSkill(userId, userSkillId, request);
    }

    @DeleteMapping("/{userSkillId}")
    public void deleteUserSkill(@PathVariable Long userSkillId) {
        Long userId = SecurityUtils.getCurrentUserId();
        userSkillService.deleteUserSkill(userId, userSkillId);
    }
}

