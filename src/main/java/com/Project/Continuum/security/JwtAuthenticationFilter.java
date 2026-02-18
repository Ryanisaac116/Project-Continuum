package com.Project.Continuum.security;

import com.Project.Continuum.entity.User;
import com.Project.Continuum.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/")
                || path.startsWith("/auth/")
                || path.startsWith("/dev/auth/")
                || path.equals("/ping");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Fallback: Check Query Param (useful for WebSocket Handshake)
            String tokenParam = request.getParameter("token");
            if (tokenParam != null && !tokenParam.isEmpty()) {
                authHeader = "Bearer " + tokenParam;
            } else {
                filterChain.doFilter(request, response);
                return;
            }
        }

        String token = authHeader.substring(7);

        try {
            Long userId = jwtUtil.extractUserId(token);
            String jwtSessionToken = jwtUtil.extractSessionToken(token);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isEmpty() || !userOpt.get().isActive()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"account_inactive\",\"message\":\"Account is inactive.\"}");
                return;
            }

            // Enforce server-side session for deterministic logout behavior.
            if (jwtSessionToken == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"session_invalidated\",\"message\":\"Session invalid. Please log in again.\"}");
                return;
            }

            User user = userOpt.get();
            String dbSessionToken = user.getSessionToken();
            if (dbSessionToken == null || !dbSessionToken.equals(jwtSessionToken)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"session_invalidated\",\"message\":\"Session invalid. Please log in again.\"}");
                return;
            }

            // Use DB role so role updates take effect immediately.
            String role = user.getRole() != null ? user.getRole().name() : "USER";

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"session_invalidated\",\"message\":\"Session invalid. Please log in again.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
