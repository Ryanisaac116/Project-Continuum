package com.Project.Continuum.repository;

import com.Project.Continuum.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    /**
     * Find all subscriptions for a user (multiple devices/browsers)
     */
    List<PushSubscription> findByUserId(Long userId);

    /**
     * Find subscription by endpoint (for update or delete)
     */
    Optional<PushSubscription> findByEndpoint(String endpoint);

    /**
     * Delete subscription by endpoint
     */
    void deleteByEndpoint(String endpoint);

    /**
     * Check if user has any active subscriptions
     */
    boolean existsByUserId(Long userId);
}
