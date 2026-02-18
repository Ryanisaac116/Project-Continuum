package com.Project.Continuum.dto.skill;

public class SkillUpdateRequest {
    private String name;
    private String category;

    public SkillUpdateRequest() {
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
