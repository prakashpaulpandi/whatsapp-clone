package com.chatapp.chatapp.service;

import com.chatapp.chatapp.model.Conversation;
import com.chatapp.chatapp.model.Message;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.repository.ConversationRepository;
import com.chatapp.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    // Send a message into a conversation
    public Message sendMessage(Long conversationId, User sender, String content) {
        Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);

        if (conversationOpt.isEmpty()) {
            throw new RuntimeException("Conversation not found");
        }

        Conversation conversation = conversationOpt.get();
        Message message = new Message(conversation, sender, content);
        return messageRepository.save(message);
    }

    // Get all messages in a conversation, oldest first
    public List<Message> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }
}