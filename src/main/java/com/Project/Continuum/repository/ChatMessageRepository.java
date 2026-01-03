package com.Project.Continuum.repository;

import com.Project.Continuum.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderBySentAtAsc(
            Long senderId1, Long recipientId1,
            Long senderId2, Long recipientId2);

}
