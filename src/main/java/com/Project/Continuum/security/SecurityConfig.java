package com.Project.Continuum.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// SECURITY CONFIG CONTRACT (DO NOT CHANGE):
// - Stateless JWT auth
// - Identity = userId only
// - No roles/permissions here
// - Google login must NOT affect this file (except permitted endpoints)

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    @Profile("dev")
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        return configureChain(http, "/api/auth/dev/**");
    }

    @Bean
    @Profile("prod")
    public SecurityFilterChain prodSecurityFilterChain(HttpSecurity http) throws Exception {
        return configureChain(http, "/api/auth/google/**");
    }

    // Shared configuration
    private SecurityFilterChain configureChain(HttpSecurity http, String permittedAuthEndpoint) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                permittedAuthEndpoint, // Profile specific
                                "/ping",
                                "/ws/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class).userDetailsService(username -> {
                    throw new UnsupportedOperationException("UserDetailsService is disabled");
                });

        return http.build();
    }
}
