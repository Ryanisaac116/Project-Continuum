package com.Project.Continuum.controller;

import com.Project.Continuum.dto.friend.FriendResponse;
import com.Project.Continuum.entity.Friend;
import com.Project.Continuum.entity.User;
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

        return friendService.getFriends(userId)
                .stream()
                .map(friend -> {
                    User other = friend.getUser1().getId().equals(userId)
                            ? friend.getUser2()
                            : friend.getUser1();

                    return new FriendResponse(
                            other.getId(),
                            other.getName(),
                            friend.getSource().name()
                    );
                })
                .toList();
    }
}
