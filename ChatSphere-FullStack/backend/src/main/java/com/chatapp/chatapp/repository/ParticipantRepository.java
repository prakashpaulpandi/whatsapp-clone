package com.chatapp.chatapp.repository;

import com.chatapp.chatapp.model.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    List<Participant> findByUserId(Long userId);
    List<Participant> findByConversationId(Long conversationId);
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
    Optional<Participant> findByConversationIdAndUserId(Long conversationId, Long userId);
    void deleteByConversationIdAndUserId(Long conversationId, Long userId);
}
