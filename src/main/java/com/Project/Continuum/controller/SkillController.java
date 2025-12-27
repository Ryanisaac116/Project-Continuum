package com.Project.Continuum.controller;

import com.Project.Continuum.dto.skill.SkillCreateRequest;
import com.Project.Continuum.dto.skill.SkillResponse;
import com.Project.Continuum.service.SkillService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping
    public SkillResponse createSkill(@RequestBody SkillCreateRequest request) {
        return skillService.createSkill(request);
    }

    @GetMapping
    public List<SkillResponse> getAllSkills() {
        return skillService.getAllSkills();
    }
}
