package com.Project.Continuum.controller;

import com.Project.Continuum.dto.users.UserResponse;
import com.Project.Continuum.dto.users.UserUpdateRequest;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userService.getUser(userId);
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PutMapping("/me")
    public UserResponse updateUser(@RequestBody UserUpdateRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return userService.updateUser(userId, request);
    }

    @PostMapping("/logout")
    public void logout() {
        Long userId = SecurityUtils.getCurrentUserId();
        userService.logout(userId);
    }

    @PatchMapping("/me/deactivate")
    public void deactivateUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        userService.deactivateUser(userId);
    }

    @DeleteMapping("/me")
    public void deleteUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        userService.deleteUser(userId);
    }
}
