package com.chatapp.chatapp.dto;

import com.chatapp.chatapp.model.Participant;
import java.time.LocalDateTime;

public class ParticipantDTO {
    private Long id;
    private UserDTO user;
    private String role;
    private LocalDateTime joinedAt;

    public ParticipantDTO() {}

    public ParticipantDTO(Participant participant) {
        if (participant != null) {
            this.id = participant.getId();
            this.user = new UserDTO(participant.getUser());
            this.role = participant.getRole();
            this.joinedAt = participant.getJoinedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
