package com.Project.Continuum.dto.userskill;

import com.Project.Continuum.enums.SkillLevel;
import com.Project.Continuum.enums.SkillType;

public class UserSkillCreateRequest {
    private Long skillId;
    private SkillLevel level;
    private SkillType skillType;

    public Long getSkillId() {
        return skillId;
    }

    public SkillLevel getLevel() {
        return level;
    }

    public SkillType getSkillType() {
        return skillType;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public void setLevel(SkillLevel level) {
        this.level = level;
    }

    public void setSkillType(SkillType skillType) {
        this.skillType = skillType;
    }
}
