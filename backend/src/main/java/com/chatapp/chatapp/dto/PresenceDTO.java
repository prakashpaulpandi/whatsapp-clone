package com.chatapp.chatapp.dto;

import java.time.LocalDateTime;

public class PresenceDTO {
    private Long userId;
    private String email;
    private boolean online;
    private LocalDateTime lastSeen;

    public PresenceDTO() {}

    public PresenceDTO(Long userId, String email, boolean online, LocalDateTime lastSeen) {
        this.userId = userId;
        this.email = email;
        this.online = online;
        this.lastSeen = lastSeen;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
}
