package com.chatapp.chatapp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Secret key used to sign tokens - keep this private and secure
    private final SecretKey secretKey = Keys.hmacShaKeyFor(
        "this-is-a-very-long-secret-key-for-jwt-signing-please-change-it".getBytes()
    );

    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24 hours

    // Generate a token for a given user email
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(secretKey)
                .compact();
    }

    // Extract the email from a token
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // Check if a token is valid (correct signature and not expired)
    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}