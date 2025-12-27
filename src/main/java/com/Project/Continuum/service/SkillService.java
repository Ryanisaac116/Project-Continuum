package com.Project.Continuum.service;

import com.Project.Continuum.dto.skill.SkillCreateRequest;
import com.Project.Continuum.dto.skill.SkillResponse;
import com.Project.Continuum.entity.Skill;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public SkillResponse createSkill(SkillCreateRequest request) {

        String name = request.getName().trim();

        if (skillRepository.existsByName(name)) {
            throw new BadRequestException("Skill already exists");
        }

        Skill skill = new Skill();
        skill.setName(name);
        skill.setCategory(request.getCategory());

        Skill saved = skillRepository.save(skill);

        return new SkillResponse(
                saved.getId(),
                saved.getName(),
                saved.getCategory()
        );
    }

    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll()
                .stream()
                .map(s -> new SkillResponse(
                        s.getId(),
                        s.getName(),
                        s.getCategory()
                ))
                .toList();
    }
}
