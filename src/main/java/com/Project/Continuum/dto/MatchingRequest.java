package com.Project.Continuum.dto;

import com.Project.Continuum.enums.MatchIntent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotNull;

public class MatchingRequest {

    @NotNull
    private MatchIntent intent;

    @NotNull
    private String category;

    @NotNull
    private Long teachSkillId;

    @NotNull
    private Long learnSkillId;

    public MatchingRequest() {
    }

    public MatchingRequest(MatchIntent intent, String category, Long teachSkillId, Long learnSkillId) {
        this.intent = intent;
        this.category = category;
        this.teachSkillId = teachSkillId;
        this.learnSkillId = learnSkillId;
    }

    public MatchIntent getIntent() {
        return intent;
    }

    public void setIntent(MatchIntent intent) {
        this.intent = intent;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getTeachSkillId() {
        return teachSkillId;
    }

    public void setTeachSkillId(Long teachSkillId) {
        this.teachSkillId = teachSkillId;
    }

    public Long getLearnSkillId() {
        return learnSkillId;
    }

    public void setLearnSkillId(Long learnSkillId) {
        this.learnSkillId = learnSkillId;
    }
}
