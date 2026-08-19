package com.chatapp.chatapp.repository;

import com.chatapp.chatapp.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
}