package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.dto.UpdateProfileRequest;
import com.chatapp.chatapp.dto.UserDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    private User getCurrentUser(Authentication authentication) {
        return userService.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(new UserDTO(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                                 Authentication authentication) {
        User user = getCurrentUser(authentication);
        User updated = userService.updateProfile(user, request);
        return ResponseEntity.ok(new UserDTO(updated));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam(value = "q", required = false) String query,
                                                     Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<UserDTO> users = userService.searchUsers(query, user.getId());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        User user = userService.getById(id);
        return ResponseEntity.ok(new UserDTO(user));
    }
}
