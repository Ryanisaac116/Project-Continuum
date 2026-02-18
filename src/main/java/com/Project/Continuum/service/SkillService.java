package com.Project.Continuum.service;

import com.Project.Continuum.dto.skill.SkillCreateRequest;
import com.Project.Continuum.dto.skill.SkillUpdateRequest;
import com.Project.Continuum.dto.skill.SkillResponse;
import com.Project.Continuum.entity.Skill;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.SkillRepository;
import com.Project.Continuum.repository.UserSkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;

    public SkillService(
            SkillRepository skillRepository,
            UserSkillRepository userSkillRepository) {
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
    }

    public SkillResponse createSkill(SkillCreateRequest request) {
        String name = normalizeName(request.getName());
        String category = normalizeCategory(request.getCategory());

        if (skillRepository.existsByNameIgnoreCaseAndCategoryIgnoreCase(name, category)) {
            throw new BadRequestException("Skill already exists");
        }

        Skill skill = new Skill();
        skill.setName(name);
        skill.setCategory(category);

        Skill saved = skillRepository.save(skill);

        return mapToResponse(saved);
    }

    public SkillResponse updateSkill(Long skillId, SkillUpdateRequest request) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        String name = normalizeName(request.getName());
        String category = normalizeCategory(request.getCategory());

        if (skillRepository.existsByNameIgnoreCaseAndCategoryIgnoreCaseAndIdNot(name, category, skillId)) {
            throw new BadRequestException("Skill already exists");
        }

        skill.setName(name);
        skill.setCategory(category);

        Skill saved = skillRepository.save(skill);
        return mapToResponse(saved);
    }

    public void deleteSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        long usageCount = userSkillRepository.countBySkill_Id(skillId);
        if (usageCount > 0) {
            throw new BadRequestException("Cannot delete skill that is used by users");
        }

        skillRepository.delete(skill);
    }

    public List<String> getAllCategories() {
        return skillRepository.findDistinctCategories().stream()
                .filter(v -> v != null && !v.isBlank())
                .toList();
    }

    private static String normalizeName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            throw new BadRequestException("Skill name is required");
        }
        String normalized = rawName.trim();
        if (normalized.length() > 100) {
            throw new BadRequestException("Skill name is too long");
        }
        return normalized;
    }

    private static String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            throw new BadRequestException("Category is required");
        }
        String normalized = rawCategory.trim();
        if (normalized.length() > 100) {
            throw new BadRequestException("Category is too long");
        }
        return normalized;
    }

    private static SkillResponse mapToResponse(Skill skill) {
        return new SkillResponse(
                skill.getId(),
                skill.getName(),
                skill.getCategory());
    }

    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAllByOrderByCategoryAscNameAsc()
                .stream()
                .map(SkillService::mapToResponse)
                .toList();
    }
}
