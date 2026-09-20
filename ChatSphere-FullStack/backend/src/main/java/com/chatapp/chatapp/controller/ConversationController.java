package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.dto.ConversationDTO;
import com.chatapp.chatapp.dto.CreateDirectChatRequest;
import com.chatapp.chatapp.dto.CreateGroupChatRequest;
import com.chatapp.chatapp.dto.ParticipantDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.ConversationService;
import com.chatapp.chatapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private UserService userService;

    private User getCurrentUser(Authentication authentication) {
        return userService.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    @PostMapping("/direct")
    public ResponseEntity<ConversationDTO> createDirectConversation(@Valid @RequestBody CreateDirectChatRequest body,
                                                                    Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        User otherUser = userService.getById(body.getOtherUserId());
        ConversationDTO conversation = conversationService.getOrCreateDirectConversation(currentUser, otherUser);
        return ResponseEntity.ok(conversation);
    }

    @PostMapping("/group")
    public ResponseEntity<ConversationDTO> createGroupConversation(@Valid @RequestBody CreateGroupChatRequest body,
                                                                   Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        ConversationDTO conversation = conversationService.createGroupConversation(currentUser, body);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ConversationDTO>> getMyConversations(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<ConversationDTO> conversations = conversationService.getUserConversations(currentUser.getId());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDTO> getConversation(@PathVariable Long id,
                                                           Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        ConversationDTO conversation = conversationService.getConversationById(id, currentUser.getId());
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ParticipantDTO>> getConversationMembers(@PathVariable Long id,
                                                                       Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<ParticipantDTO> members = conversationService.getConversationMembers(id, currentUser.getId());
        return ResponseEntity.ok(members);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        conversationService.leaveGroup(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Successfully left group"));
    }
}
