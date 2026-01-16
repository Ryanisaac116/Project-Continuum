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
    private final org.springframework.messaging.simp.SimpMessageSendingOperations messagingTemplate;

    public FriendService(FriendRepository friendRepository,
            ExchangeSessionRepository exchangeSessionRepository,
            com.Project.Continuum.store.PresenceStore presenceStore,
            org.springframework.messaging.simp.SimpMessageSendingOperations messagingTemplate) {
        this.friendRepository = friendRepository;
        this.exchangeSessionRepository = exchangeSessionRepository;
        this.presenceStore = presenceStore;
        this.messagingTemplate = messagingTemplate;
    }

    // 🔥 Send Friend Request
    public void sendFriendRequest(User sender, User receiver, FriendSource source) {

        if (sender.getId().equals(receiver.getId()))
            return;

        // 1. Verify Audio Exchange Completion (Service Layer Truth)
        // Must have at least one COMPLETED session between them.
        // Check both orderings since sessions may not be stored with consistent
        // ordering
        boolean hasCompletedSession = exchangeSessionRepository
                .existsByUserA_IdAndUserB_IdAndStatusIn(
                        sender.getId(), receiver.getId(),
                        List.of(ExchangeStatus.COMPLETED, ExchangeStatus.ACTIVE))
                || exchangeSessionRepository
                        .existsByUserA_IdAndUserB_IdAndStatusIn(
                                receiver.getId(), sender.getId(),
                                List.of(ExchangeStatus.COMPLETED, ExchangeStatus.ACTIVE));

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

        // 🔥 Broadcast real-time event to receiver
        messagingTemplate.convertAndSendToUser(
                String.valueOf(receiver.getId()),
                "/queue/friends",
                java.util.Map.of(
                        "event", "FRIEND_REQUEST_RECEIVED",
                        "requesterId", sender.getId(),
                        "requesterName", sender.getName(),
                        "presence", presenceStore.getStatus(sender.getId()).name()));
    }

    // 🔥 Accept Friend Request
    public void acceptFriendRequest(Long currentUserId, Long requesterId) {
        Long u1 = Math.min(currentUserId, requesterId);
        Long u2 = Math.max(currentUserId, requesterId);

        Friend friend = friendRepository.findByUser1_IdAndUser2_Id(u1, u2)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            return; // Already accepted - idempotent
        }

        if (friend.getRequester().getId().equals(currentUserId)) {
            throw new BadRequestException("You cannot accept your own request.");
        }

        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        // 🔥 Broadcast real-time event to requester (they now have a new friend)
        User currentUser = friend.getUser1().getId().equals(currentUserId) ? friend.getUser1() : friend.getUser2();
        messagingTemplate.convertAndSendToUser(
                String.valueOf(requesterId),
                "/queue/friends",
                java.util.Map.of(
                        "event", "FRIEND_REQUEST_ACCEPTED",
                        "friendId", currentUserId,
                        "friendName", currentUser.getName(),
                        "presence", presenceStore.getStatus(currentUserId).name()));
    }

    // 🔥 Reject Friend Request
    public void rejectFriendRequest(Long currentUserId, Long requesterId) {
        Long u1 = Math.min(currentUserId, requesterId);
        Long u2 = Math.max(currentUserId, requesterId);

        Friend friend = friendRepository.findByUser1_IdAndUser2_Id(u1, u2)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (friend.getStatus() == FriendStatus.REJECTED) {
            return; // Already rejected - idempotent
        }

        if (friend.getStatus() == FriendStatus.ACCEPTED) {
            throw new BadRequestException("Cannot reject an already accepted friendship.");
        }

        if (friend.getRequester().getId().equals(currentUserId)) {
            throw new BadRequestException("You cannot reject your own request.");
        }

        friend.setStatus(FriendStatus.REJECTED);
        friendRepository.save(friend);

        // 🔥 Broadcast real-time event to requester
        messagingTemplate.convertAndSendToUser(
                String.valueOf(requesterId),
                "/queue/friends",
                java.util.Map.of(
                        "event", "FRIEND_REQUEST_REJECTED",
                        "friendId", currentUserId));
    }

    // 🔥 Remove Friend
    public void removeFriend(Long currentUserId, Long friendId) {
        // Normalize IDs
        Long u1 = Math.min(currentUserId, friendId);
        Long u2 = Math.max(currentUserId, friendId);

        Friend friend = friendRepository.findByUser1_IdAndUser2_Id(u1, u2)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        friendRepository.delete(friend);

        // 🔥 Broadcast REMOVED to the OTHER person
        // (The one who initiated the removal knows because they clicked the button, but
        // updating their local state is handled by the controller return or frontend
        // opt)
        // Actually, broadcast to BOTH to be safe or just the other.
        // Let's broadcast to the 'other' user.
        Long otherUserId = friend.getUser1().getId().equals(currentUserId) ? friend.getUser2().getId()
                : friend.getUser1().getId();

        messagingTemplate.convertAndSendToUser(
                String.valueOf(otherUserId),
                "/queue/friends",
                java.util.Map.of(
                        "event", "FRIEND_REMOVED",
                        "friendId", currentUserId));
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

    /**
     * Get pending incoming friend requests (where current user is the receiver)
     */
    public List<com.Project.Continuum.dto.friend.FriendRequestResponse> getPendingRequests(Long currentUserId) {
        List<Friend> friendships = friendRepository.findByUser1_IdOrUser2_Id(currentUserId, currentUserId);

        return friendships.stream()
                .filter(f -> f.getStatus() == FriendStatus.PENDING)
                .filter(f -> !f.getRequester().getId().equals(currentUserId)) // Only incoming requests
                .map(friend -> {
                    User requester = friend.getRequester();
                    return new com.Project.Continuum.dto.friend.FriendRequestResponse(
                            requester.getId(),
                            requester.getName(),
                            presenceStore.getStatus(requester.getId()),
                            friend.getConnectedAt());
                })
                .toList();
    }

    /**
     * Get recently met users from completed exchange sessions
     * Excludes users who already have a friend relationship (pending/accepted)
     */
    public List<com.Project.Continuum.dto.friend.RecentlyMetResponse> getRecentlyMet(Long currentUserId) {
        // Get all completed sessions for this user
        List<com.Project.Continuum.entity.ExchangeSession> sessions = exchangeSessionRepository
                .findByUserA_IdOrUserB_Id(currentUserId, currentUserId);

        // Get existing friend relationships to exclude
        List<Friend> friendships = friendRepository.findByUser1_IdOrUser2_Id(currentUserId, currentUserId);
        java.util.Set<Long> friendUserIds = friendships.stream()
                .map(f -> f.getUser1().getId().equals(currentUserId) ? f.getUser2().getId() : f.getUser1().getId())
                .collect(java.util.stream.Collectors.toSet());

        // Deduplicate by userId, keeping the most recent session
        java.util.Map<Long, com.Project.Continuum.dto.friend.RecentlyMetResponse> userMap = new java.util.LinkedHashMap<>();

        sessions.stream()
                .filter(s -> s.getStatus() == ExchangeStatus.COMPLETED || s.getStatus() == ExchangeStatus.ACTIVE)
                .forEach(session -> {
                    User otherUser = session.getUserA().getId().equals(currentUserId)
                            ? session.getUserB()
                            : session.getUserA();
                    Long otherUserId = otherUser.getId();

                    // Skip if already friends
                    if (friendUserIds.contains(otherUserId))
                        return;

                    // Only add if not already in map, or if this session is more recent
                    if (!userMap.containsKey(otherUserId)) {
                        userMap.put(otherUserId, new com.Project.Continuum.dto.friend.RecentlyMetResponse(
                                otherUserId,
                                otherUser.getName(),
                                presenceStore.getStatus(otherUserId),
                                session.getEndedAt()));
                    }
                });

        return new java.util.ArrayList<>(userMap.values());
    }
}
