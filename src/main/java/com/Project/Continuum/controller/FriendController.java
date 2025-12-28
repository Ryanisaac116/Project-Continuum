package com.Project.Continuum.controller;

import com.Project.Continuum.dto.friend.FriendResponse;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.FriendService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public List<FriendResponse> getFriends() {

        Long userId = SecurityUtils.getCurrentUserId();

        // ✅ Service already returns FriendResponse with presence
        return friendService.getFriends(userId);
    }
}
