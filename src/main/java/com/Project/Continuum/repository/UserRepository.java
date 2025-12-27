package com.Project.Continuum.repository;

import com.Project.Continuum.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByIdAndIsActiveTrue(Long id);

}
