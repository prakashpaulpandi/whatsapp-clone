package com.chatapp.chatapp.repository;

import com.chatapp.chatapp.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c JOIN Participant p1 ON p1.conversation.id = c.id JOIN Participant p2 ON p2.conversation.id = c.id " +
           "WHERE c.type = 'direct' AND p1.user.id = :userAId AND p2.user.id = :userBId")
    Optional<Conversation> findDirectConversationBetween(@Param("userAId") Long userAId, @Param("userBId") Long userBId);

    @Query("SELECT DISTINCT c FROM Conversation c JOIN Participant p ON p.conversation.id = c.id WHERE p.user.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") Long userId);
}
