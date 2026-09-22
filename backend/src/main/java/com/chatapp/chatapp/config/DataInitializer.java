package com.chatapp.chatapp.config;

import com.chatapp.chatapp.dto.SignupRequest;
import com.chatapp.chatapp.repository.UserRepository;
import com.chatapp.chatapp.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Override
    public void run(String... args) throws Exception {
        // Auto-seed Alice Johnson demo user
        if (!userRepository.existsByEmail("alice@chatsphere.dev")) {
            SignupRequest alice = new SignupRequest(
                "Alice Johnson",
                "alice@chatsphere.dev",
                "password123",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            );
            userService.registerUser(alice);
            logger.info("Created initial demo user: alice@chatsphere.dev (password: password123)");
        }

        // Auto-seed Bob Smith demo user
        if (!userRepository.existsByEmail("bob@chatsphere.dev")) {
            SignupRequest bob = new SignupRequest(
                "Bob Smith",
                "bob@chatsphere.dev",
                "password123",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
            );
            userService.registerUser(bob);
            logger.info("Created initial demo user: bob@chatsphere.dev (password: password123)");
        }

        // Auto-seed Charlie Brown demo user
        if (!userRepository.existsByEmail("charlie@chatsphere.dev")) {
            SignupRequest charlie = new SignupRequest(
                "Charlie Brown",
                "charlie@chatsphere.dev",
                "password123",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
            );
            userService.registerUser(charlie);
            logger.info("Created initial demo user: charlie@chatsphere.dev (password: password123)");
        }
    }
}
