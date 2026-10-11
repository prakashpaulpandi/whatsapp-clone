package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.config.JwtUtil;
import com.chatapp.chatapp.dto.AuthRequest;
import com.chatapp.chatapp.dto.AuthResponse;
import com.chatapp.chatapp.dto.SignupRequest;
import com.chatapp.chatapp.dto.UserDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.LoginAttemptService;
import com.chatapp.chatapp.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginAttemptService loginAttemptService;

    // ── Signup ────────────────────────────────────────────────────────────────

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getEmail());
        UserDTO userDTO = new UserDTO(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, userDTO));
    }

    // ── Login (with rate limiting) ────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request,
                                   HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);

        // 1. Check if IP is rate-limited
        if (loginAttemptService.isBlocked(clientIp)) {
            long minutesLeft = loginAttemptService.minutesUntilUnblocked(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                        "error", "Too many failed login attempts. Please try again in " + minutesLeft + " minute(s).",
                        "blockedFor", minutesLeft
                    ));
        }

        // 2. Verify credentials
        Optional<User> userOpt = userService.findByEmail(request.getEmail());

        if (userOpt.isEmpty() || !userService.checkPassword(request.getPassword(), userOpt.get().getPassword())) {
            // Record failure and return generic message (don't leak whether email exists)
            loginAttemptService.recordFailure(clientIp);

            int attemptsLeft = Math.max(0, 5 - (int) loginAttemptService.minutesUntilUnblocked(clientIp));

            // After recording, check if now blocked
            if (loginAttemptService.isBlocked(clientIp)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of(
                            "error", "Too many failed attempts. Your IP has been blocked for 15 minutes.",
                            "blockedFor", 15
                        ));
            }

            throw new BadCredentialsException("Invalid email or password");
        }

        // 3. Success — clear failure record and issue JWT
        loginAttemptService.recordSuccess(clientIp);

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getEmail());
        UserDTO userDTO = new UserDTO(user);
        return ResponseEntity.ok(new AuthResponse(token, userDTO));
    }

    /**
     * Demo endpoint — issues a short-lived JWT for the Alice demo account
     * WITHOUT exposing any password in the frontend JavaScript.
     *
     * The demo token lasts only 2 hours (vs the normal 24 hours).
     * This endpoint is intentionally rate-limited by the same LoginAttemptService
     * to prevent enumeration attacks.
     */
    @PostMapping("/demo")
    public ResponseEntity<?> loginAsDemo(@RequestParam(defaultValue = "alice") String account,
                                         HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);

        if (loginAttemptService.isBlocked(clientIp)) {
            long minutesLeft = loginAttemptService.minutesUntilUnblocked(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please wait " + minutesLeft + " minute(s)."));
        }

        String email = switch (account.toLowerCase()) {
            case "bob"     -> "bob@chatsphere.dev";
            case "charlie" -> "charlie@chatsphere.dev";
            default        -> "alice@chatsphere.dev";
        };

        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Demo account not yet created. Please wait a moment and try again."));
        }

        // Issue a short-lived demo token (2 hours)
        String token = jwtUtil.generateDemoToken(email);
        UserDTO userDTO = new UserDTO(userOpt.get());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", userDTO,
            "isDemo", true,
            "expiresInHours", 2
        ));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Extracts the real client IP, respecting X-Forwarded-For from reverse proxies.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
