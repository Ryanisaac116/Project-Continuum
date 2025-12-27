package com.Project.Continuum.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {}

    // SECURITY CONTRACT (DO NOT CHANGE):
// - Principal MUST be Long userId
// - No User entity here
// - No provider logic here

    public static Long getCurrentUserId() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated request");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Long)) {
            throw new IllegalStateException("Invalid authentication principal");
        }

        return (Long) principal;
    }

}
