package com.chatapp.chatapp.service;

import com.chatapp.chatapp.dto.SignupRequest;
import com.chatapp.chatapp.dto.UpdateProfileRequest;
import com.chatapp.chatapp.dto.UserDTO;
import com.chatapp.chatapp.exception.ResourceNotFoundException;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getName().trim(), request.getEmail().toLowerCase().trim(), hashedPassword);
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return userRepository.findByEmail(email.toLowerCase().trim());
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    @Transactional
    public void updateUserPresence(Long userId, boolean online) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(online);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public User updateProfile(User user, UpdateProfileRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getAbout() != null) {
            user.setAbout(request.getAbout().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        return userRepository.save(user);
    }

    public List<UserDTO> searchUsers(String query, Long currentUserId) {
        List<User> users;
        if (query == null || query.isBlank()) {
            users = userRepository.findAllExcept(currentUserId);
        } else {
            users = userRepository.searchUsers(query.trim(), currentUserId);
        }
        return users.stream().map(UserDTO::new).collect(Collectors.toList());
    }
}
