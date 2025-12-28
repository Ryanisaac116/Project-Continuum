package com.Project.Continuum.service;

import com.Project.Continuum.dto.friend.FriendResponse;
import com.Project.Continuum.entity.Friend;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.FriendSource;
import com.Project.Continuum.repository.FriendRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FriendService {

    private final FriendRepository friendRepository;

    public FriendService(FriendRepository friendRepository) {
        this.friendRepository = friendRepository;
    }

    public void createFriendship(User a, User b, FriendSource source) {

        if (a.getId().equals(b.getId())) return;

        User user1 = a.getId() < b.getId() ? a : b;
        User user2 = a.getId() < b.getId() ? b : a;

        if (friendRepository.existsByUser1_IdAndUser2_Id(
                user1.getId(), user2.getId())) {
            return;
        }

        Friend friend = new Friend();
        friend.setUser1(user1);
        friend.setUser2(user2);
        friend.setSource(source);

        friendRepository.save(friend);
    }

    public List<FriendResponse> getFriends(Long currentUserId) {

        List<Friend> friendships =
                friendRepository.findByUser1_IdOrUser2_Id(currentUserId, currentUserId);

        return friendships.stream()
                .map(friend -> {

                    User otherUser =
                            friend.getUser1().getId().equals(currentUserId)
                                    ? friend.getUser2()
                                    : friend.getUser1();

                    return new FriendResponse(
                            otherUser.getId(),                 // friendUserId
                            otherUser.getName(),               // name
                            otherUser.getPresenceStatus()      // 🔥 presence from User
                    );
                })
                .toList();
    }


}
