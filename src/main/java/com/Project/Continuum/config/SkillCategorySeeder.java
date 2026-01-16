package com.Project.Continuum.config;

import com.Project.Continuum.entity.Skill;
import com.Project.Continuum.repository.SkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Configuration
@Profile("dev")
public class SkillCategorySeeder {

    private static final Logger log = LoggerFactory.getLogger(SkillCategorySeeder.class);

    @Bean
    public CommandLineRunner seedSkillCategories(SkillRepository skillRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Checking Skill Categories Seeding...");
            fixSchema(jdbcTemplate);
            seedSkills(skillRepository);
        };
    }

    private void fixSchema(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        try {
            // Attempt to drop the old unique constraint on 'name'
            // The error 'Duplicate entry ... for key 'skills.name'' suggests the index name
            // is 'name'
            jdbcTemplate.execute("ALTER TABLE skills DROP INDEX name");
            log.info("Dropped old unique index 'name' from skills table.");
        } catch (Exception e) {
            // Start of message usually contains the SQL error code or message
            log.info("Old unique index 'name' cleanup skipped (might not exist): " + e.getMessage());
        }
    }

    @Transactional
    public void seedSkills(SkillRepository skillRepository) {
        // 1. Backfill existing null categories
        List<Skill> allSkills = skillRepository.findAll();
        boolean updated = false;
        for (Skill s : allSkills) {
            if (s.getCategory() == null || s.getCategory().isEmpty()) {
                s.setCategory("Programming");
                updated = true;
            }
        }
        if (updated) {
            skillRepository.saveAll(allSkills);
            log.info("Backfilled {} skills with default category 'Programming'", allSkills.size());
        }

        // 2. Add specific multi-category skills if missing
        createIfNotExists(skillRepository, "Composition", "Music");
        createIfNotExists(skillRepository, "Composition", "Design");
        createIfNotExists(skillRepository, "Piano", "Music");
        createIfNotExists(skillRepository, "Yoga", "Health");
        createIfNotExists(skillRepository, "Java", "Programming");
        createIfNotExists(skillRepository, "React", "Programming");
    }

    private void createIfNotExists(SkillRepository repo, String name, String category) {
        if (!repo.existsByNameAndCategory(name, category)) {
            Skill s = new Skill();
            s.setName(name);
            s.setCategory(category);
            repo.save(s);
            log.info("Seeded Skill: {} ({})", name, category);
        }
    }
}
