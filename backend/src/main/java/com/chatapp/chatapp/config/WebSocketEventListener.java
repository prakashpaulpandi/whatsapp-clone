package com.chatapp.chatapp.config;

import com.chatapp.chatapp.dto.PresenceDTO;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserService userService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null) {
            String email = principal.getName();
            logger.info("User connected via WebSocket: {}", email);
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                userService.updateUserPresence(user.getId(), true);

                PresenceDTO presence = new PresenceDTO(user.getId(), user.getEmail(), true, LocalDateTime.now());
                messagingTemplate.convertAndSend("/topic/presence", presence);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal != null) {
            String email = principal.getName();
            logger.info("User disconnected from WebSocket: {}", email);
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                userService.updateUserPresence(user.getId(), false);

                PresenceDTO presence = new PresenceDTO(user.getId(), user.getEmail(), false, LocalDateTime.now());
                messagingTemplate.convertAndSend("/topic/presence", presence);
            }
        }
    }
}
