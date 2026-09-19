package com.chatapp.chatapp;

import com.chatapp.chatapp.dto.AuthRequest;
import com.chatapp.chatapp.dto.AuthResponse;
import com.chatapp.chatapp.dto.CreateDirectChatRequest;
import com.chatapp.chatapp.dto.CreateGroupChatRequest;
import com.chatapp.chatapp.dto.SendMessageRequest;
import com.chatapp.chatapp.dto.SignupRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
public class ChatSphereIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String aliceToken;
    private Long aliceId;
    private String bobToken;
    private Long bobId;

    @BeforeEach
    void setUp() throws Exception {
        // Register Alice
        SignupRequest aliceSignup = new SignupRequest("Alice Johnson", "alice@chatsphere.dev", "password123", null);
        MvcResult aliceRes = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(aliceSignup)))
                .andExpect(status().isCreated())
                .andReturn();
        AuthResponse aliceAuth = objectMapper.readValue(aliceRes.getResponse().getContentAsString(), AuthResponse.class);
        aliceToken = aliceAuth.getToken();
        aliceId = aliceAuth.getUser().getId();

        // Register Bob
        SignupRequest bobSignup = new SignupRequest("Bob Smith", "bob@chatsphere.dev", "password123", null);
        MvcResult bobRes = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bobSignup)))
                .andExpect(status().isCreated())
                .andReturn();
        AuthResponse bobAuth = objectMapper.readValue(bobRes.getResponse().getContentAsString(), AuthResponse.class);
        bobToken = bobAuth.getToken();
        bobId = bobAuth.getUser().getId();
    }

    @Test
    @DisplayName("Auth Flow: Login returns JWT token and user info")
    void testLoginFlow() throws Exception {
        AuthRequest loginReq = new AuthRequest("alice@chatsphere.dev", "password123");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("alice@chatsphere.dev"));
    }

    @Test
    @DisplayName("User Discovery: Alice can search for Bob")
    void testUserSearch() throws Exception {
        mockMvc.perform(get("/api/users/search?q=Bob")
                .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Bob Smith"))
                .andExpect(jsonPath("$[0].email").value("bob@chatsphere.dev"));
    }

    @Test
    @DisplayName("Direct Chat: Alice starts 1-on-1 chat with Bob, duplicate calls return same chat")
    void testDirectChatCreationAndReuse() throws Exception {
        CreateDirectChatRequest directReq = new CreateDirectChatRequest(bobId);

        // 1st call creates conversation
        MvcResult res1 = mockMvc.perform(post("/api/conversations/direct")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(directReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("direct"))
                .andReturn();

        Long convId1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asLong();

        // 2nd call by Bob or Alice reuses same conversation
        MvcResult res2 = mockMvc.perform(post("/api/conversations/direct")
                .header("Authorization", "Bearer " + bobToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateDirectChatRequest(aliceId))))
                .andExpect(status().isOk())
                .andReturn();

        Long convId2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("id").asLong();
        org.junit.jupiter.api.Assertions.assertEquals(convId1, convId2, "Duplicate direct conversations must be reused");
    }

    @Test
    @DisplayName("Group Chat: Alice creates group with Bob and sends messages")
    void testGroupChatAndMessaging() throws Exception {
        CreateGroupChatRequest groupReq = new CreateGroupChatRequest();
        groupReq.setName("Engineering Team");
        groupReq.setDescription("Discussing real-time architecture");
        groupReq.setMemberIds(List.of(bobId));

        MvcResult groupRes = mockMvc.perform(post("/api/conversations/group")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(groupReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Engineering Team"))
                .andReturn();

        Long convId = objectMapper.readTree(groupRes.getResponse().getContentAsString()).get("id").asLong();

        // Alice sends a message
        SendMessageRequest msgReq = new SendMessageRequest(convId, "Hello Team! Real-time messaging is live!");
        mockMvc.perform(post("/api/messages/send")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(msgReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Hello Team! Real-time messaging is live!"));

        // Bob reads messages
        mockMvc.perform(get("/api/messages/" + convId)
                .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk());

        // Bob marks as read
        mockMvc.perform(post("/api/messages/" + convId + "/read")
                .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Security: Unauthorized user cannot view or send to conversation they are not part of")
    void testSecurityParticipantValidation() throws Exception {
        // Register Charlie
        SignupRequest charlieSignup = new SignupRequest("Charlie Brown", "charlie@chatsphere.dev", "password123", null);
        MvcResult charlieRes = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(charlieSignup)))
                .andExpect(status().isCreated())
                .andReturn();
        String charlieToken = objectMapper.readValue(charlieRes.getResponse().getContentAsString(), AuthResponse.class).getToken();

        // Alice & Bob direct chat
        CreateDirectChatRequest directReq = new CreateDirectChatRequest(bobId);
        MvcResult convRes = mockMvc.perform(post("/api/conversations/direct")
                .header("Authorization", "Bearer " + aliceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(directReq)))
                .andReturn();
        Long convId = objectMapper.readTree(convRes.getResponse().getContentAsString()).get("id").asLong();

        // Charlie tries to get messages -> Should be 403 Forbidden
        mockMvc.perform(get("/api/messages/" + convId)
                .header("Authorization", "Bearer " + charlieToken))
                .andExpect(status().isForbidden());
    }
}
