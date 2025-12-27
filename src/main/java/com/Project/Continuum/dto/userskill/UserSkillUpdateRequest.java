package com.Project.Continuum.dto.userskill;

import com.Project.Continuum.enums.SkillLevel;
import com.Project.Continuum.enums.SkillType;

public class UserSkillUpdateRequest {
    private SkillLevel level;
    private SkillType skillType;

    public SkillLevel getLevel() {
        return level;
    }

    public SkillType getSkillType() {
        return skillType;
    }
}
