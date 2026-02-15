package com.Project.Continuum.repository;

import com.Project.Continuum.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import com.Project.Continuum.enums.AuthProvider;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByAuthProviderAndProviderUserId(AuthProvider authProvider, String providerUserId);

    org.springframework.data.domain.Page<User> findByRoleNot(com.Project.Continuum.enums.UserRole role,
            org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndIsActiveTrue(Long id);

    @Query("""
            SELECT u FROM User u
            WHERE u.presenceStatus != com.Project.Continuum.enums.PresenceStatus.OFFLINE
            AND (u.lastSeenAt IS NULL OR u.lastSeenAt < :cutoff)
            """)
    List<User> findUsersToMarkOffline(@Param("cutoff") java.time.Instant cutoff);

    long countByLastSeenAtAfter(java.time.Instant cutoff);

}
