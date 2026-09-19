package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.config.JwtUtil;
import com.chatapp.chatapp.dto.AuthRequest;
import com.chatapp.chatapp.dto.AuthResponse;
import com.chatapp.chatapp.dto.SignupRequest;
import com.chatapp.chatapp.dto.UserDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        User user = userService.registerUser(request);
        String token = jwtUtil.generateToken(user.getEmail());
        UserDTO userDTO = new UserDTO(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, userDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Optional<User> userOpt = userService.findByEmail(request.getEmail());

        if (userOpt.isEmpty() || !userService.checkPassword(request.getPassword(), userOpt.get().getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getEmail());
        UserDTO userDTO = new UserDTO(user);
        return ResponseEntity.ok(new AuthResponse(token, userDTO));
    }
}
