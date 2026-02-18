package com.Project.Continuum.repository;

import com.Project.Continuum.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndCategory(String name, String category);

    boolean existsByNameIgnoreCaseAndCategoryIgnoreCase(String name, String category);

    boolean existsByNameIgnoreCaseAndCategoryIgnoreCaseAndIdNot(String name, String category, Long id);

    List<Skill> findAllByOrderByCategoryAscNameAsc();

    @Query("select distinct s.category from Skill s order by s.category asc")
    List<String> findDistinctCategories();
}
