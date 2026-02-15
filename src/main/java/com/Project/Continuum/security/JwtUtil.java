package com.Project.Continuum.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;
    private final Duration expiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") Duration expiration) {

        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
    }

    // Original method for backward compatibility (no session token, default USER
    // role)
    public String generateToken(Long userId) {
        return generateToken(userId, null, "USER");
    }

    // Method with session token (default USER role)
    public String generateToken(Long userId, String sessionToken) {
        return generateToken(userId, sessionToken, "USER");
    }

    // Full method with session token and role
    public String generateToken(Long userId, String sessionToken, String role) {
        var builder = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration.toMillis()))
                .claim("role", role);

        if (sessionToken != null) {
            builder.claim("session_token", sessionToken);
        }

        return builder.signWith(key).compact();
    }

    public Long extractUserId(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public String extractSessionToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("session_token", String.class);
    }

    public String extractRole(String token) {
        Claims claims = parseClaims(token);
        String role = claims.get("role", String.class);
        return role != null ? role : "USER";
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
