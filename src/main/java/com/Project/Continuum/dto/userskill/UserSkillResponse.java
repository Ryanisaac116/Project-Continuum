package com.Project.Continuum.dto.userskill;

public class UserSkillResponse {
    private Long id;
    private String skillName;
    private String category;
    private String level;
    private String type;

    public UserSkillResponse(Long id, String skillName, String category, String level, String type) {
        this.id = id;
        this.skillName = skillName;
        this.category = category;
        this.level = level;
        this.type = type;
    }

    public Long getId() { return id; }
    public String getSkillName() { return skillName; }
    public String getCategory() { return category; }
    public String getLevel() { return level; }
    public String getType() { return type; }
}
