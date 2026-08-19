package com.chatapp.chatapp.repository;

import com.chatapp.chatapp.model.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByUserId(Long userId);

    List<Participant> findByConversationId(Long conversationId);
}