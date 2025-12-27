package com.Project.Continuum.dto.profile;

public class UserProfileResponse {

    private Long userId;
    private String headline;
    private String about;
    private String learningGoals;
    private String teachingStyle;

    public UserProfileResponse(
            Long userId,
            String headline,
            String about,
            String learningGoals,
            String teachingStyle) {

        this.userId = userId;
        this.headline = headline;
        this.about = about;
        this.learningGoals = learningGoals;
        this.teachingStyle = teachingStyle;
    }

    public Long getUserId() { return userId; }
    public String getHeadline() { return headline; }
    public String getAbout() { return about; }
    public String getLearningGoals() { return learningGoals; }
    public String getTeachingStyle() { return teachingStyle; }
}
