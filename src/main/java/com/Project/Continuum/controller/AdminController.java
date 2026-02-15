package com.Project.Continuum.controller;

import com.Project.Continuum.dto.admin.DashboardStatsResponse;
import com.Project.Continuum.dto.admin.AdminUserResponse;
import com.Project.Continuum.dto.admin.UserActivityResponse;
import com.Project.Continuum.service.AdminService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @GetMapping("/users/{id}/activity")
    public ResponseEntity<UserActivityResponse> getUserActivity(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserActivity(id));
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        adminService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/reactivate")
    public ResponseEntity<Void> reactivateUser(@PathVariable Long id) {
        adminService.reactivateUser(id);
        return ResponseEntity.noContent().build();
    }
}
