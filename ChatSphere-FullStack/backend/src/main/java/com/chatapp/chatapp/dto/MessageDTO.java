package com.chatapp.chatapp.dto;

import com.chatapp.chatapp.model.Message;
import java.time.LocalDateTime;

public class MessageDTO {
    private Long id;
    private Long conversationId;
    private UserDTO sender;
    private String content;
    private String messageType;
    private LocalDateTime timestamp;
    private boolean isRead;

    public MessageDTO() {}

    public MessageDTO(Message message) {
        if (message != null) {
            this.id = message.getId();
            this.conversationId = message.getConversation() != null ? message.getConversation().getId() : null;
            this.sender = message.getSender() != null ? new UserDTO(message.getSender()) : null;
            this.content = message.getContent();
            this.messageType = message.getMessageType();
            this.timestamp = message.getTimestamp();
            this.isRead = message.isRead();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public UserDTO getSender() { return sender; }
    public void setSender(UserDTO sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
}
