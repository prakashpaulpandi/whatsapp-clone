package com.chatapp.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "direct" for one-on-one chats, "group" for group chats
    @Column(nullable = false)
    private String type;

    // only used for group chats (e.g. "Family Group")
    private String name;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Conversation() {
    }

    public Conversation(String type, String name) {
        this.type = type;
        this.name = name;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}