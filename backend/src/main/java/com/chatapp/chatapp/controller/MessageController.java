package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.dto.MessageDTO;
import com.chatapp.chatapp.dto.SendMessageRequest;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.MessageService;
import com.chatapp.chatapp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    private User getCurrentUser(Authentication authentication) {
        return userService.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    @PostMapping("/send")
    public ResponseEntity<MessageDTO> sendMessage(@Valid @RequestBody SendMessageRequest request,
                                                  Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        MessageDTO message = messageService.sendMessage(currentUser, request);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<MessageDTO>> getMessages(@PathVariable Long conversationId,
                                                        Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<MessageDTO> messages = messageService.getMessages(conversationId, currentUser.getId());
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{conversationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long conversationId,
                                        Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        messageService.markMessagesAsRead(conversationId, currentUser);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }
}
