package com.Project.Continuum.dto.users;

public class UserResponse {
    private Long id;
    private String name;
    private String bio;

    public UserResponse(Long id, String name,  String bio) {
        this.id = id;
        this.name = name;

        this.bio = bio;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }



    public String getBio() {
        return bio;
    }
}
