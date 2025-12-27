package com.Project.Continuum.matching;

public class MatchCandidate {

    private Long userId;
    private String name;
    private String headline;
    private String skillName;
    private String teacherLevel;

    public MatchCandidate(
            Long userId,
            String name,
            String headline,
            String skillName,
            String teacherLevel) {

        this.userId = userId;
        this.name = name;
        this.headline = headline;
        this.skillName = skillName;
        this.teacherLevel = teacherLevel;
    }

    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getHeadline() { return headline; }
    public String getSkillName() { return skillName; }
    public String getTeacherLevel() { return teacherLevel; }
}
