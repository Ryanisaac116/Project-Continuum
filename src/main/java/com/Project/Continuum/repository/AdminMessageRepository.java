package com.Project.Continuum.repository;

import com.Project.Continuum.entity.AdminMessage;
import com.Project.Continuum.enums.AdminMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminMessageRepository extends JpaRepository<AdminMessage, Long> {

    // Find by status (e.g. OPEN)
    Page<AdminMessage> findByStatusOrderByCreatedAtDesc(AdminMessageStatus status, Pageable pageable);

    // Find all
    Page<AdminMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
