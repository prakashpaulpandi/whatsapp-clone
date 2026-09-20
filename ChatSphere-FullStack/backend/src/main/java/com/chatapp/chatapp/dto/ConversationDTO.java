package com.chatapp.chatapp.dto;

import com.chatapp.chatapp.model.Conversation;
import java.time.LocalDateTime;
import java.util.List;

public class ConversationDTO {
    private Long id;
    private String type;
    private String name;
    private String description;
    private String avatarUrl;
    private UserDTO otherUser; // For direct chats
    private List<ParticipantDTO> participants;
    private MessageDTO lastMessage;
    private long unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConversationDTO() {}

    public ConversationDTO(Conversation conversation) {
        if (conversation != null) {
            this.id = conversation.getId();
            this.type = conversation.getType();
            this.name = conversation.getName();
            this.description = conversation.getDescription();
            this.avatarUrl = conversation.getAvatarUrl();
            this.createdAt = conversation.getCreatedAt();
            this.updatedAt = conversation.getUpdatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public UserDTO getOtherUser() { return otherUser; }
    public void setOtherUser(UserDTO otherUser) { this.otherUser = otherUser; }
    public List<ParticipantDTO> getParticipants() { return participants; }
    public void setParticipants(List<ParticipantDTO> participants) { this.participants = participants; }
    public MessageDTO getLastMessage() { return lastMessage; }
    public void setLastMessage(MessageDTO lastMessage) { this.lastMessage = lastMessage; }
    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
