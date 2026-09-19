package com.chatapp.chatapp.service;

import com.chatapp.chatapp.dto.ConversationDTO;
import com.chatapp.chatapp.dto.CreateGroupChatRequest;
import com.chatapp.chatapp.dto.MessageDTO;
import com.chatapp.chatapp.dto.ParticipantDTO;
import com.chatapp.chatapp.dto.UserDTO;
import com.chatapp.chatapp.exception.ResourceNotFoundException;
import com.chatapp.chatapp.exception.UnauthorizedException;
import com.chatapp.chatapp.model.Conversation;
import com.chatapp.chatapp.model.Message;
import com.chatapp.chatapp.model.Participant;
import com.chatapp.chatapp.model.User;
import com.chatapp.chatapp.repository.ConversationRepository;
import com.chatapp.chatapp.repository.MessageRepository;
import com.chatapp.chatapp.repository.ParticipantRepository;
import com.chatapp.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // Create or reuse direct 1-on-1 conversation
    @Transactional
    public ConversationDTO getOrCreateDirectConversation(User currentUser, User otherUser) {
        if (currentUser.getId().equals(otherUser.getId())) {
            throw new IllegalArgumentException("Cannot start conversation with yourself");
        }

        // Check if direct conversation already exists
        Optional<Conversation> existing = conversationRepository.findDirectConversationBetween(currentUser.getId(), otherUser.getId());
        Conversation conversation;
        if (existing.isPresent()) {
            conversation = existing.get();
        } else {
            conversation = new Conversation("direct", null);
            conversation = conversationRepository.save(conversation);

            participantRepository.save(new Participant(conversation, currentUser, "MEMBER"));
            participantRepository.save(new Participant(conversation, otherUser, "MEMBER"));
        }

        return mapToDTO(conversation, currentUser.getId());
    }

    // Create a group conversation
    @Transactional
    public ConversationDTO createGroupConversation(User currentUser, CreateGroupChatRequest request) {
        Conversation newConv = new Conversation("group", request.getName(), request.getDescription(), request.getAvatarUrl());
        final Conversation savedConv = conversationRepository.save(newConv);

        // Add creator as ADMIN
        participantRepository.save(new Participant(savedConv, currentUser, "ADMIN"));

        // Add other members
        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (!memberId.equals(currentUser.getId())) {
                    userRepository.findById(memberId).ifPresent(member -> {
                        participantRepository.save(new Participant(savedConv, member, "MEMBER"));
                    });
                }
            }
        }

        // Create initial system message
        Message systemMsg = new Message(savedConv, currentUser, currentUser.getName() + " created group \"" + savedConv.getName() + "\"", "SYSTEM");
        messageRepository.save(systemMsg);

        return mapToDTO(savedConv, currentUser.getId());
    }

    // Get all conversations for a user formatted with latest messages and unread counts
    public List<ConversationDTO> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(userId);
        List<ConversationDTO> dtos = new ArrayList<>();

        for (Conversation conv : conversations) {
            dtos.add(mapToDTO(conv, userId));
        }

        // Sort by latest activity (updatedAt or lastMessage timestamp)
        dtos.sort((a, b) -> {
            LocalDateTime timeA = a.getLastMessage() != null ? a.getLastMessage().getTimestamp() : a.getUpdatedAt();
            LocalDateTime timeB = b.getLastMessage() != null ? b.getLastMessage().getTimestamp() : b.getUpdatedAt();
            if (timeA == null) return 1;
            if (timeB == null) return -1;
            return timeB.compareTo(timeA);
        });

        return dtos;
    }

    public ConversationDTO getConversationById(Long conversationId, Long currentUserId) {
        validateMembership(conversationId, currentUserId);
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        return mapToDTO(conversation, currentUserId);
    }

    public List<ParticipantDTO> getConversationMembers(Long conversationId, Long currentUserId) {
        validateMembership(conversationId, currentUserId);
        List<Participant> participants = participantRepository.findByConversationId(conversationId);
        return participants.stream().map(ParticipantDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public void leaveGroup(Long conversationId, User user) {
        validateMembership(conversationId, user.getId());
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!"group".equalsIgnoreCase(conversation.getType())) {
            throw new IllegalArgumentException("Cannot leave a direct conversation");
        }

        participantRepository.deleteByConversationIdAndUserId(conversationId, user.getId());

        Message systemMsg = new Message(conversation, user, user.getName() + " left the group", "SYSTEM");
        messageRepository.save(systemMsg);
    }

    public void validateMembership(Long conversationId, Long userId) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, userId);
        if (!isParticipant) {
            throw new UnauthorizedException("You are not a participant in this conversation");
        }
    }

    public ConversationDTO mapToDTO(Conversation conversation, Long currentUserId) {
        ConversationDTO dto = new ConversationDTO(conversation);

        List<Participant> participants = participantRepository.findByConversationId(conversation.getId());
        dto.setParticipants(participants.stream().map(ParticipantDTO::new).collect(Collectors.toList()));

        if ("direct".equalsIgnoreCase(conversation.getType())) {
            for (Participant p : participants) {
                if (!p.getUser().getId().equals(currentUserId)) {
                    dto.setOtherUser(new UserDTO(p.getUser()));
                    break;
                }
            }
        }

        Optional<Message> lastMessageOpt = messageRepository.findFirstByConversationIdOrderByTimestampDesc(conversation.getId());
        lastMessageOpt.ifPresent(message -> dto.setLastMessage(new MessageDTO(message)));

        long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), currentUserId);
        dto.setUnreadCount(unreadCount);

        return dto;
    }
}
