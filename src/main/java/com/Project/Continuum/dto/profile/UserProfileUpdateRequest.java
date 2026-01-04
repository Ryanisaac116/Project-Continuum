package com.Project.Continuum.dto.profile;

public class UserProfileUpdateRequest {

    private String headline;
    private String about;
    private String learningGoals;
    private String teachingStyle;

    public String getHeadline() {
        return headline;
    }

    public String getAbout() {
        return about;
    }

    public String getLearningGoals() {
        return learningGoals;
    }

    public String getTeachingStyle() {
        return teachingStyle;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public void setLearningGoals(String learningGoals) {
        this.learningGoals = learningGoals;
    }

    public void setTeachingStyle(String teachingStyle) {
        this.teachingStyle = teachingStyle;
    }
}
