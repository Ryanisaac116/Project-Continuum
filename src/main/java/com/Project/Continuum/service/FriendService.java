package com.Project.Continuum.service;

import com.Project.Continuum.dto.friend.FriendResponse;
import com.Project.Continuum.entity.Friend;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.enums.FriendSource;
import com.Project.Continuum.repository.FriendRepository;
import com.Project.Continuum.repository.ExchangeSessionRepository;
import com.Project.Continuum.enums.FriendStatus;
import com.Project.Continuum.enums.ExchangeStatus;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FriendService {

    private final FriendRepository friendRepository;
    private final ExchangeSessionRepository exchangeSessionRepository;
    private final com.Project.Continuum.store.PresenceStore presenceStore;

    public FriendService(FriendRepository friendRepository,
            ExchangeSessionRepository exchangeSessionRepository,
            com.Project.Continuum.store.PresenceStore presenceStore) {
        this.friendRepository = friendRepository;
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.presenceStore = presenceStore;
    }

    // 🔥 Send Friend Request
    public void sendFriendRequest(User sender, User receiver, FriendSource source) {

        if (sender.getId().equals(receiver.getId()))
            return;

        // 1. Verify Audio Exchange Completion (Service Layer Truth)
        // Must have at least one COMPLETED session between them.
        boolean hasCompletedSession = exchangeSessionRepository
                .findByUserA_IdAndUserB_IdAndStatusIn(
                        Math.min(sender.getId(), receiver.getId()),
                        Math.max(sender.getId(), receiver.getId()),
                        List.of(ExchangeStatus.COMPLETED))
                .isPresent();

        if (!hasCompletedSession && source == FriendSource.EXCHANGE) {
            // "Friends can be added only after a completed audio call"
            throw new BadRequestException(
                    "You must complete an audio exchange session before sending a friend request.");
        }

        User user1 = sender.getId() < receiver.getId() ? sender : receiver;
        User user2 = sender.getId() < receiver.getId() ? receiver : sender;

        // 2. Check Existing
        Optional<Friend> existing = friendRepository.findByUser1_IdAndUser2_Id(user1.getId(), user2.getId());
        if (existing.isPresent()) {
            Friend f = existing.get();
            if (f.getStatus() == FriendStatus.ACCEPTED) {
                throw new BadRequestException("You are already friends.");
            }
            if (f.getStatus() == FriendStatus.PENDING) {
                throw new BadRequestException("Friend request is already pending.");
            }
            // blocked/rejected? for now fail.
            return;
        }

        Friend friend = new Friend();
        friend.setUser1(user1);
        friend.setUser2(user2);
        friend.setRequester(sender); // Set requester
        friend.setSource(source);
        friend.setStatus(FriendStatus.PENDING); // Set Pending

        friendRepository.save(friend);
    }

    // 🔥 Accept Friend Request
    public void acceptFriendRequest(Long currentUserId, Long requesterId) {
        Long u1 = Math.min(currentUserId, requesterId);
        Long u2 = Math.max(currentUserId, requesterId);

        Friend friend = friendRepository.findByUser1_IdAndUser2_Id(u1, u2)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            return; // Already accepted
        }

        if (friend.getRequester().getId().equals(currentUserId)) {
            throw new BadRequestException("You cannot accept your own request.");
        }

        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        // Broadcast presence update?
        // Friends list will now capture this via next polling/fetch.
        // PresenceService.updatePresence might need to be triggered if we want
        // Real-time List update?
        // But `FriendService` returns status.
    }

    public List<FriendResponse> getFriends(Long currentUserId) {

        List<Friend> friendships = friendRepository.findByUser1_IdOrUser2_Id(currentUserId, currentUserId);

        return friendships.stream()
                .filter(f -> f.getStatus() == FriendStatus.ACCEPTED) // 🔥 Filter only ACCEPTED
                .map(friend -> {

                    User otherUser = friend.getUser1().getId().equals(currentUserId)
                            ? friend.getUser2()
                            : friend.getUser1();

                    // 🔥 Use Store for Real-Time Status
                    return new FriendResponse(
                            otherUser.getId(),
                            otherUser.getName(),
                            presenceStore.getStatus(otherUser.getId()));
                })
                .toList();
    }
}
