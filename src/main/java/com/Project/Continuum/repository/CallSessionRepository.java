package com.Project.Continuum.repository;

import com.Project.Continuum.entity.CallSession;
import com.Project.Continuum.enums.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CallSessionRepository extends JpaRepository<CallSession, Long> {

        /**
         * Find active call for a user (as caller or receiver) in RINGING or ACCEPTED
         * status
         */
        @Query("SELECT c FROM CallSession c WHERE " +
                        "(c.caller.id = :userId OR c.receiver.id = :userId) " +
                        "AND c.status IN :statuses")
        List<CallSession> findActiveCallsByUserId(
                        @Param("userId") Long userId,
                        @Param("statuses") List<CallStatus> statuses);

        /**
         * Find active call by ID and user (for authorization)
         */
        @Query("SELECT c FROM CallSession c WHERE c.id = :callId " +
                        "AND (c.caller.id = :userId OR c.receiver.id = :userId)")
        Optional<CallSession> findByIdAndUserId(
                        @Param("callId") Long callId,
                        @Param("userId") Long userId);

        /**
         * Find active calls linked to an exchange session.
         * Used to end calls when exchange ends.
         */
        @Query("SELECT c FROM CallSession c WHERE " +
                        "c.exchangeSession.id = :exchangeSessionId " +
                        "AND c.status IN :statuses")
        List<CallSession> findActiveCallsByExchangeSessionId(
                        @Param("exchangeSessionId") Long exchangeSessionId,
                        @Param("statuses") List<CallStatus> statuses);

        /**
         * Check if user has any active call (RINGING or ACCEPTED)
         */
        default boolean hasActiveCall(Long userId) {
                return !findActiveCallsByUserId(userId, List.of(CallStatus.RINGING, CallStatus.ACCEPTED)).isEmpty();
        }

        void deleteByCaller_IdOrReceiver_Id(Long callerId, Long receiverId);
}
