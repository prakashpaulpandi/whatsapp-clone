package com.chatapp.chatapp.dto;

import com.chatapp.chatapp.model.User;
import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private String about;
    private boolean online;
    private LocalDateTime lastSeen;

    public UserDTO() {
    }

    public UserDTO(User user) {
        if (user != null) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
            this.avatarUrl = user.getAvatarUrl();
            this.about = user.getAbout();
            this.online = user.isOnline();
            this.lastSeen = user.getLastSeen();
        }
    }

    public UserDTO(Long id, String name, String email, String avatarUrl, String about, boolean online, LocalDateTime lastSeen) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.about = about;
        this.online = online;
        this.lastSeen = lastSeen;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }
    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
}
