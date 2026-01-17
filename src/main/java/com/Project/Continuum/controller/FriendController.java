package com.Project.Continuum.controller;

import com.Project.Continuum.dto.friend.FriendResponse;
import com.Project.Continuum.dto.friend.FriendRequestResponse;
import com.Project.Continuum.dto.friend.RecentlyMetResponse;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.FriendService;
import org.springframework.web.bind.annotation.*;
import com.Project.Continuum.enums.FriendSource;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;
    private final com.Project.Continuum.repository.UserRepository userRepository;

    public FriendController(FriendService friendService,
            com.Project.Continuum.repository.UserRepository userRepository) {
        this.friendService = friendService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<FriendResponse> getFriends() {
        Long userId = SecurityUtils.getCurrentUserId();
        return friendService.getFriends(userId);
    }

    @GetMapping("/requests")
    public List<FriendRequestResponse> getPendingRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        return friendService.getPendingRequests(userId);
    }

    @GetMapping("/recently-met")
    public List<RecentlyMetResponse> getRecentlyMet() {
        Long userId = SecurityUtils.getCurrentUserId();
        return friendService.getRecentlyMet(userId);
    }

    @PostMapping("/{targetUserId}/request")
    public void sendFriendRequest(@PathVariable Long targetUserId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        com.Project.Continuum.entity.User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new com.Project.Continuum.exception.ResourceNotFoundException("User not found"));

        com.Project.Continuum.entity.User receiver = userRepository.findById(targetUserId)
                .orElseThrow(
                        () -> new com.Project.Continuum.exception.ResourceNotFoundException("Target user not found"));

        // Enforce EXCHANGE source to checks for completed session
        friendService.sendFriendRequest(sender, receiver, FriendSource.EXCHANGE);
    }

    @PostMapping("/{requesterId}/accept")
    public void acceptFriendRequest(@PathVariable Long requesterId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        friendService.acceptFriendRequest(currentUserId, requesterId);
    }

    @PostMapping("/{requesterId}/reject")
    public void rejectFriendRequest(@PathVariable Long requesterId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        friendService.rejectFriendRequest(currentUserId, requesterId);
    }
}
