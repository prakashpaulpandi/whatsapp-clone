package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.model.Message;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.MessageService;
import com.chatapp.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        return userOpt.orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Send a message into a conversation
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);

        Long conversationId = Long.valueOf(body.get("conversationId").toString());
        String content = (String) body.get("content");

        Message message = messageService.sendMessage(conversationId, currentUser, content);
        return ResponseEntity.ok(message);
    }

    // Get all messages in a conversation
    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getMessages(@PathVariable Long conversationId) {
        List<Message> messages = messageService.getMessages(conversationId);
        return ResponseEntity.ok(messages);
    }
}