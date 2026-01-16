package com.Project.Continuum.repository;

import com.Project.Continuum.entity.UserSkill;
import com.Project.Continuum.enums.SkillType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    // All skills of a user
    List<UserSkill> findByUser_Id(Long userId);

    // Specific skill of a user (TEACH / LEARN)
    Optional<UserSkill> findByUser_IdAndSkill_IdAndSkillType(
            Long userId,
            Long skillId,
            SkillType skillType);

    // Validate ownership
    Optional<UserSkill> findByIdAndUser_Id(Long id, Long userId);

    // All TEACH or LEARN skills of a user
    List<UserSkill> findByUser_IdAndSkillType(Long userId, SkillType skillType);

    // Matching: who teaches / learns a skill
    List<UserSkill> findBySkill_IdAndSkillType(Long skillId, SkillType skillType);

    boolean existsByUser_IdAndSkill_IdAndSkillType(Long userId, Long skillId, SkillType skillType);
}
