package com.Project.Continuum.repository;

import com.Project.Continuum.entity.Friend;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    // Check if two users are already friends (ordered pair)
    boolean existsByUser1_IdAndUser2_Id(Long user1Id, Long user2Id);

    // Get all friends of a user
    List<Friend> findByUser1_IdOrUser2_Id(Long userId1, Long userId2);
}
