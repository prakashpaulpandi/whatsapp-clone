package com.chatapp.chatapp.dto;

public class TypingEventDTO {
    private Long conversationId;
    private Long userId;
    private String userName;
    private boolean isTyping;

    public TypingEventDTO() {}

    public TypingEventDTO(Long conversationId, Long userId, String userName, boolean isTyping) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.userName = userName;
        this.isTyping = isTyping;
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public boolean isTyping() { return isTyping; }
    public void setTyping(boolean typing) { isTyping = typing; }
}
