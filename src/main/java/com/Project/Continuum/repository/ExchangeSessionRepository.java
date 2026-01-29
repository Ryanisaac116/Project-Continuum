package com.Project.Continuum.repository;

import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.enums.ExchangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExchangeSessionRepository
                extends JpaRepository<ExchangeSession, Long> {

        // 🔹 Find an active or ongoing session between two users
        Optional<ExchangeSession> findByUserA_IdAndUserB_IdAndStatusIn(
                        Long userAId,
                        Long userBId,
                        Collection<ExchangeStatus> statuses);

        // 🔹 Check if any session exists between users with given statuses
        boolean existsByUserA_IdAndUserB_IdAndStatusIn(
                        Long userAId,
                        Long userBId,
                        Collection<ExchangeStatus> statuses);

        // 🔹 Find session by request
        Optional<ExchangeSession> findByRequest_Id(Long requestId);

        // 🔹 Find all sessions where user is participant
        List<ExchangeSession> findByUserA_IdOrUserB_Id(Long userAId, Long userBId);

        // 🔹 Count sessions by status (for dashboard metrics)
        long countByStatus(ExchangeStatus status);

        // 🔹 Count user's sessions by status
        @Query("SELECT COUNT(s) FROM ExchangeSession s WHERE (s.userA.id = :userId OR s.userB.id = :userId) AND s.status = :status")
        long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ExchangeStatus status);

        // 🔹 Find recently met users (Sessions completed since given time)
        @Query("SELECT CASE WHEN s.userA.id = :userId THEN s.userB.id ELSE s.userA.id END " +
                        "FROM ExchangeSession s " +
                        "WHERE (s.userA.id = :userId OR s.userB.id = :userId) " +
                        "AND s.status = 'COMPLETED' " +
                        "AND s.endedAt > :since")
        List<Long> findRecentlyMetUserIds(@Param("userId") Long userId, @Param("since") java.time.Instant since);
}
