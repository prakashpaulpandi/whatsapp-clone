package com.chatapp.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SendMessageRequest {
    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 4000, message = "Message content exceeds maximum length")
    private String content;

    private String messageType = "TEXT";

    public SendMessageRequest() {}

    public SendMessageRequest(Long conversationId, String content) {
        this.conversationId = conversationId;
        this.content = content;
        this.messageType = "TEXT";
    }

    public SendMessageRequest(Long conversationId, String content, String messageType) {
        this.conversationId = conversationId;
        this.content = content;
        this.messageType = messageType != null ? messageType : "TEXT";
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
}
