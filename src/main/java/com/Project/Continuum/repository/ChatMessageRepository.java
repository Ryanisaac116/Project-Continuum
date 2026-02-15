package com.Project.Continuum.repository;

import com.Project.Continuum.entity.ChatMessage;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySender_IdAndRecipient_IdOrSender_IdAndRecipient_IdOrderBySentAtAsc(
            Long senderId1, Long recipientId1,
            Long senderId2, Long recipientId2);

    List<ChatMessage> findByRecipient_IdAndDeliveredAtIsNull(Long recipientId);

    @Query("SELECT c.id FROM ChatMessage c WHERE c.sender.id = :userId OR c.recipient.id = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage c SET c.replyTo = NULL WHERE c.replyTo.id IN :messageIds")
    int clearReplyReferences(@Param("messageIds") List<Long> messageIds);

    void deleteBySender_IdOrRecipient_Id(Long senderId, Long recipientId);

    long countBySender(com.Project.Continuum.entity.User sender);

}
