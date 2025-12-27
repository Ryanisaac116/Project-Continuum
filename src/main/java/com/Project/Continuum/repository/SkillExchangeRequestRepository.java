package com.Project.Continuum.repository;

import com.Project.Continuum.entity.SkillExchangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SkillExchangeRequestRepository
        extends JpaRepository<SkillExchangeRequest, Long> {

    // All requests involving a user (sent or received)
    List<SkillExchangeRequest> findBySender_IdOrReceiver_Id(
            Long senderId,
            Long receiverId
    );

    // Prevent duplicate requests
    Optional<SkillExchangeRequest>
    findBySender_IdAndReceiver_IdAndSenderSkill_IdAndReceiverSkill_Id(
            Long senderId,
            Long receiverId,
            Long senderSkillId,
            Long receiverSkillId
    );
}
