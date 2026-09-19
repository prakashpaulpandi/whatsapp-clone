package com.chatapp.chatapp.dto;

import java.time.LocalDateTime;

public class ReadReceiptDTO {
    private Long conversationId;
    private Long readerId;
    private String readerName;
    private LocalDateTime readAt;

    public ReadReceiptDTO() {}

    public ReadReceiptDTO(Long conversationId, Long readerId, String readerName) {
        this.conversationId = conversationId;
        this.readerId = readerId;
        this.readerName = readerName;
        this.readAt = LocalDateTime.now();
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public Long getReaderId() { return readerId; }
    public void setReaderId(Long readerId) { this.readerId = readerId; }
    public String getReaderName() { return readerName; }
    public void setReaderName(String readerName) { this.readerName = readerName; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}
