package com.Project.Continuum.controller;

import com.Project.Continuum.dto.skill.SkillCreateRequest;
import com.Project.Continuum.dto.skill.SkillResponse;
import com.Project.Continuum.dto.skill.SkillUpdateRequest;
import com.Project.Continuum.service.SkillService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/skills")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSkillController {

    private final SkillService skillService;

    public AdminSkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    @PostMapping
    public ResponseEntity<SkillResponse> createSkill(@RequestBody SkillCreateRequest request) {
        return ResponseEntity.ok(skillService.createSkill(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SkillResponse> updateSkill(@PathVariable Long id, @RequestBody SkillUpdateRequest request) {
        return ResponseEntity.ok(skillService.updateSkill(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(skillService.getAllCategories());
    }
}
