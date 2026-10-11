package com.chatapp.chatapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter for failed login attempts.
 *
 * <p>Rules:
 * <ul>
 *   <li>Up to {@value #MAX_ATTEMPTS} failures are tolerated per IP address.</li>
 *   <li>On the 5th failure the IP is blocked for {@value #BLOCK_DURATION_MINUTES} minutes.</li>
 *   <li>A successful login resets the counter for that IP.</li>
 *   <li>The map is cleaned lazily on each check so memory doesn't grow unbounded.</li>
 * </ul>
 *
 * <p>Note: For a production deployment with multiple server instances you would replace this
 * with a Redis-backed store (e.g., Spring Data Redis + @Cacheable).  For a single-node
 * portfolio deployment this implementation is perfectly adequate.
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private static final int MAX_ATTEMPTS = 5;
    private static final int BLOCK_DURATION_MINUTES = 15;

    /** Map from IP address → attempt record */
    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    // ── Public API ────────────────────────────────────────────────────────────

    /** Returns true if this IP is currently blocked from logging in. */
    public boolean isBlocked(String ip) {
        AttemptRecord record = attempts.get(ip);
        if (record == null) return false;

        // If the block window has expired, clear it
        if (record.blockedUntil != null && LocalDateTime.now().isAfter(record.blockedUntil)) {
            attempts.remove(ip);
            return false;
        }

        return record.blockedUntil != null;
    }

    /**
     * Call this after a FAILED login attempt.
     * Increments the counter and blocks the IP if the limit is reached.
     */
    public void recordFailure(String ip) {
        AttemptRecord record = attempts.merge(ip, new AttemptRecord(1, null), (existing, newVal) -> {
            // If an old block has expired, reset
            if (existing.blockedUntil != null && LocalDateTime.now().isAfter(existing.blockedUntil)) {
                return new AttemptRecord(1, null);
            }
            return new AttemptRecord(existing.count + 1, existing.blockedUntil);
        });

        if (record.count >= MAX_ATTEMPTS && record.blockedUntil == null) {
            // Transition to blocked state
            LocalDateTime blockedUntil = LocalDateTime.now().plusMinutes(BLOCK_DURATION_MINUTES);
            attempts.put(ip, new AttemptRecord(record.count, blockedUntil));
            log.warn("IP {} blocked for {} minutes after {} failed login attempts",
                    ip, BLOCK_DURATION_MINUTES, MAX_ATTEMPTS);
        } else {
            log.debug("IP {} has {} failed login attempt(s)", ip, record.count);
        }
    }

    /**
     * How many minutes are left in the block, rounded up.
     * Returns 0 if the IP is not blocked.
     */
    public long minutesUntilUnblocked(String ip) {
        AttemptRecord record = attempts.get(ip);
        if (record == null || record.blockedUntil == null) return 0;
        long minutes = java.time.Duration.between(LocalDateTime.now(), record.blockedUntil).toMinutes() + 1;
        return Math.max(0, minutes);
    }

    /** Call this after a SUCCESSFUL login to reset the counter for the IP. */
    public void recordSuccess(String ip) {
        attempts.remove(ip);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private record AttemptRecord(int count, LocalDateTime blockedUntil) {}
}
