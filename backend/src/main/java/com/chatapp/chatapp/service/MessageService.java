package com.chatapp.chatapp.service;

import com.chatapp.chatapp.dto.MessageDTO;
import com.chatapp.chatapp.dto.ReadReceiptDTO;
import com.chatapp.chatapp.dto.SendMessageRequest;
import com.chatapp.chatapp.exception.ResourceNotFoundException;
import com.chatapp.chatapp.model.Conversation;
import com.chatapp.chatapp.model.Message;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.repository.ConversationRepository;
import com.chatapp.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDTO sendMessage(User sender, SendMessageRequest request) {
        Long conversationId = request.getConversationId();
        conversationService.validateMembership(conversationId, sender.getId());

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        Message message = new Message(conversation, sender, request.getContent(), request.getMessageType());
        message = messageRepository.save(message);

        // Update conversation timestamp
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageDTO messageDTO = new MessageDTO(message);

        // Broadcast to all participants on conversation channel
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, messageDTO);

        return messageDTO;
    }

    public List<MessageDTO> getMessages(Long conversationId, Long currentUserId) {
        conversationService.validateMembership(conversationId, currentUserId);
        List<Message> messages = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        return messages.stream().map(MessageDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Long conversationId, User user) {
        conversationService.validateMembership(conversationId, user.getId());
        int updatedCount = messageRepository.markMessagesAsRead(conversationId, user.getId());

        if (updatedCount > 0) {
            ReadReceiptDTO receipt = new ReadReceiptDTO(conversationId, user.getId(), user.getName());
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read", receipt);
        }
    }
}
