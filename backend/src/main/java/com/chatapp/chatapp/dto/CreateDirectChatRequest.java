package com.chatapp.chatapp.dto;

import jakarta.validation.constraints.NotNull;

public class CreateDirectChatRequest {
    @NotNull(message = "otherUserId is required")
    private Long otherUserId;

    public CreateDirectChatRequest() {}
    public CreateDirectChatRequest(Long otherUserId) { this.otherUserId = otherUserId; }
    public Long getOtherUserId() { return otherUserId; }
    public void setOtherUserId(Long otherUserId) { this.otherUserId = otherUserId; }
}
