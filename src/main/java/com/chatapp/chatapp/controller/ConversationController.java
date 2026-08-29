package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.model.Conversation;
import com.chatapp.chatapp.model.Participant;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.ConversationService;
import com.chatapp.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private UserService userService;

    // Helper: get the currently logged-in user from the token
    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        return userOpt.orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Create a direct (1-on-1) conversation with another user
    @PostMapping("/direct")
    public ResponseEntity<?> createDirectConversation(@RequestBody Map<String, Long> body,
                                                        Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Long otherUserId = body.get("otherUserId");

        Optional<User> otherUserOpt = userService.findById(otherUserId);
        if (otherUserOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Other user not found"));
        }

        Conversation conversation = conversationService.createDirectConversation(currentUser, otherUserOpt.get());
        return ResponseEntity.ok(conversation);
    }

    // Create a group conversation
    @PostMapping("/group")
    public ResponseEntity<?> createGroupConversation(@RequestBody Map<String, Object> body,
                                                       Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        String groupName = (String) body.get("name");

        @SuppressWarnings("unchecked")
        List<Integer> memberIds = (List<Integer>) body.get("memberIds");

        List<User> members = memberIds.stream()
                .map(id -> userService.findById(Long.valueOf(id)).orElse(null))
                .filter(u -> u != null)
                .collect(Collectors.toList());

        members.add(currentUser); // include the creator too

        Conversation conversation = conversationService.createGroupConversation(groupName, members);
        return ResponseEntity.ok(conversation);
    }

    // Get all conversations for the logged-in user
    @GetMapping("/my")
    public ResponseEntity<?> getMyConversations(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<Participant> participants = conversationService.getUserConversations(currentUser.getId());

        List<Conversation> conversations = participants.stream()
                .map(Participant::getConversation)
                .collect(Collectors.toList());

        return ResponseEntity.ok(conversations);
    }
}