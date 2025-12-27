package com.Project.Continuum.repository;

import com.Project.Continuum.entity.ExchangeSession;
import com.Project.Continuum.enums.ExchangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface ExchangeSessionRepository
        extends JpaRepository<ExchangeSession, Long> {

    // 🔹 Find an active or ongoing session between two users
    Optional<ExchangeSession> findByUserA_IdAndUserB_IdAndStatusIn(
            Long userAId,
            Long userBId,
            Collection<ExchangeStatus> statuses
    );

    // 🔹 Find session by request
    Optional<ExchangeSession> findByRequest_Id(Long requestId);
}
