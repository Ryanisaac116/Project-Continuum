package com.Project.Continuum.repository;

import com.Project.Continuum.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndCategory(String name, String category);
}
