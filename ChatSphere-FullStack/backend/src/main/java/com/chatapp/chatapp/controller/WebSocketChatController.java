package com.chatapp.chatapp.controller;

import com.chatapp.chatapp.dto.SendMessageRequest;
import com.chatapp.chatapp.dto.TypingEventDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.MessageService;
import com.chatapp.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Optional;

@Controller
public class WebSocketChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @MessageMapping("/chat.send")
    public void handleSendMessage(@Payload SendMessageRequest request, Principal principal) {
        if (principal != null) {
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            userOpt.ifPresent(user -> messageService.sendMessage(user, request));
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTypingEvent(@Payload TypingEventDTO event, Principal principal) {
        if (principal != null && event.getConversationId() != null) {
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                event.setUserId(user.getId());
                event.setUserName(user.getName());
                messagingTemplate.convertAndSend("/topic/conversations/" + event.getConversationId() + "/typing", event);
            }
        }
    }

    @MessageMapping("/chat.read")
    public void handleReadEvent(@Payload Long conversationId, Principal principal) {
        if (principal != null && conversationId != null) {
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            userOpt.ifPresent(user -> messageService.markMessagesAsRead(conversationId, user));
        }
    }
}
