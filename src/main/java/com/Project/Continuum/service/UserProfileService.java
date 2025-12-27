package com.Project.Continuum.service;

import com.Project.Continuum.dto.profile.UserProfileResponse;
import com.Project.Continuum.dto.profile.UserProfileUpdateRequest;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.entity.UserProfile;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserProfileRepository;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public UserProfileService(
            UserRepository userRepository,
            UserProfileRepository profileRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    /* ================= GET PROFILE ================= */

    public UserProfileResponse getProfile(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfile profile = profileRepository
                .findByUser_Id(userId)
                .orElseGet(() -> createEmptyProfile(user));

        return map(profile);
    }

    /* ================= UPDATE PROFILE ================= */

    public UserProfileResponse updateProfile(
            Long userId,
            UserProfileUpdateRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfile profile = profileRepository
                .findByUser_Id(userId)
                .orElseGet(() -> createEmptyProfile(user));

        if (request.getHeadline() != null) {
            profile.setHeadline(request.getHeadline());
        }
        if (request.getAbout() != null) {
            profile.setAbout(request.getAbout());
        }
        if (request.getLearningGoals() != null) {
            profile.setLearningGoals(request.getLearningGoals());
        }
        if (request.getTeachingStyle() != null) {
            profile.setTeachingStyle(request.getTeachingStyle());
        }

        return map(profileRepository.save(profile));
    }

    /* ================= HELPERS ================= */

    private UserProfile createEmptyProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        return profileRepository.save(profile);
    }

    private UserProfileResponse map(UserProfile p) {
        return new UserProfileResponse(
                p.getUser().getId(),
                p.getHeadline(),
                p.getAbout(),
                p.getLearningGoals(),
                p.getTeachingStyle()
        );
    }
}
