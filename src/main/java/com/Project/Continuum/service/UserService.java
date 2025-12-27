package com.Project.Continuum.service;

import com.Project.Continuum.dto.users.UserResponse;
import com.Project.Continuum.dto.users.UserUpdateRequest;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 🔹 GET CURRENT USER
    public UserResponse getUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return mapToResponse(user);
    }

    // 🔹 UPDATE CURRENT USER
    public UserResponse updateUser(
            Long userId,
            UserUpdateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }

        return mapToResponse(userRepository.save(user));
    }

    // 🔹 SOFT DELETE CURRENT USER
    public void deactivateUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setActive(false);
        userRepository.save(user);
    }

    // 🔹 SAFE RESPONSE MAPPING
    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getBio()
        );
    }
}
