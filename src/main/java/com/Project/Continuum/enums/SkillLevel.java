package com.Project.Continuum.enums;

public enum SkillLevel {

    BEGINNER(1),
    INTERMEDIATE(2),
    EXPERT(3);

    private final int rank;

    SkillLevel(int rank) {
        this.rank = rank;
    }

    public boolean canTeach(SkillLevel learnerLevel) {
        return this.rank >= learnerLevel.rank;
    }
}
