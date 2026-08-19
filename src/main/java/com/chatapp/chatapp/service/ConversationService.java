package com.chatapp.chatapp.service;

import com.chatapp.chatapp.model.Conversation;
import com.chatapp.chatapp.model.Participant;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.repository.ConversationRepository;
import com.chatapp.chatapp.repository.ParticipantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    // Create a direct (1-on-1) conversation between two users
    public Conversation createDirectConversation(User userA, User userB) {
        Conversation conversation = new Conversation("direct", null);
        conversation = conversationRepository.save(conversation);

        participantRepository.save(new Participant(conversation, userA));
        participantRepository.save(new Participant(conversation, userB));

        return conversation;
    }

    // Create a group conversation with a name and a list of members
    public Conversation createGroupConversation(String groupName, List<User> members) {
        Conversation conversation = new Conversation("group", groupName);
        conversation = conversationRepository.save(conversation);

        for (User member : members) {
            participantRepository.save(new Participant(conversation, member));
        }

        return conversation;
    }

    // Get all conversations a specific user is part of
    public List<Participant> getUserConversations(Long userId) {
        return participantRepository.findByUserId(userId);
    }

    // Get all members of a specific conversation
    public List<Participant> getConversationMembers(Long conversationId) {
        return participantRepository.findByConversationId(conversationId);
    }
}