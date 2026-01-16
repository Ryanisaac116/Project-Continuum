package com.Project.Continuum;

import com.Project.Continuum.enums.AuthProvider;

import com.Project.Continuum.dto.exchange.ExchangeRequestCreateRequest;
import com.Project.Continuum.dto.exchange.ExchangeRequestUpdateRequest;
import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.*;
import com.Project.Continuum.repository.*;
import com.Project.Continuum.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ExchangeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private SkillExchangeRequestRepository requestRepository;

    @Autowired
    private ExchangeSessionRepository sessionRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private UserSkill skillA;
    private UserSkill skillB;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        requestRepository.deleteAll();
        userSkillRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        userA = createUser("User A", "userA_exchange");
        userB = createUser("User B", "userB_exchange");

        tokenA = "Bearer " + jwtUtil.generateToken(userA.getId());
        tokenB = "Bearer " + jwtUtil.generateToken(userB.getId());

        // 2. Create Skills
        Skill javaSkill = createSkill("Java", "Programming");
        Skill pythonSkill = createSkill("Python", "Programming");

        // 3. Assign Skills
        skillA = createUserSkill(userA, javaSkill, SkillType.TEACH);
        skillB = createUserSkill(userB, pythonSkill, SkillType.LEARN);
    }

    @Test
    void testExchangeLifecycle_HappyPath() throws Exception {
        // -----------------------------------------------------------------
        // 1. Send Exchange Request (A -> B)
        // -----------------------------------------------------------------
        ExchangeRequestCreateRequest createReq = new ExchangeRequestCreateRequest();
        setField(createReq, "receiverId", userB.getId());
        setField(createReq, "senderSkillId", skillA.getId());
        setField(createReq, "receiverSkillId", skillB.getId());

        String res1 = mockMvc.perform(post("/api/exchanges")
                .header("Authorization", tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode node1 = objectMapper.readTree(res1);
        Long requestId = node1.get("id").asLong();
        assertEquals("PENDING", node1.get("status").asText());

        // -----------------------------------------------------------------
        // 2. Accept Request (B)
        // -----------------------------------------------------------------
        ExchangeRequestUpdateRequest updateReq = new ExchangeRequestUpdateRequest();
        setField(updateReq, "status", ExchangeRequestStatus.ACCEPTED);

        mockMvc.perform(put("/api/exchanges/" + requestId)
                .header("Authorization", tokenB)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // -----------------------------------------------------------------
        // 3. Start Session (A) -> REQUESTED
        // -----------------------------------------------------------------
        // POST /api/sessions?requestId=...&intent=AUDIO_CALL
        String res2 = mockMvc.perform(post("/api/sessions")
                .header("Authorization", tokenA)
                .param("requestId", String.valueOf(requestId))
                .param("intent", "AUDIO_CALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUESTED"))
                .andReturn().getResponse().getContentAsString();

        Long sessionId = objectMapper.readTree(res2).get("sessionId").asLong();

        // -----------------------------------------------------------------
        // 4. Accept Session (B) -> ACCEPTED
        // -----------------------------------------------------------------
        mockMvc.perform(post("/api/sessions/" + sessionId + "/accept")
                .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // -----------------------------------------------------------------
        // 5. Activate Session (A OR B) -> ACTIVE
        // -----------------------------------------------------------------
        mockMvc.perform(post("/api/sessions/" + sessionId + "/activate")
                .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Verify Presence Side Effect (Both BUSY)
        // Need to refetch users from repository as transactional update happens
        User freshA = userRepository.findById(userA.getId()).get();
        User freshB = userRepository.findById(userB.getId()).get();
        assertEquals(PresenceStatus.BUSY, freshA.getPresenceStatus());
        assertEquals(PresenceStatus.BUSY, freshB.getPresenceStatus());

        // -----------------------------------------------------------------
        // 6. End Session (B) -> COMPLETED
        // -----------------------------------------------------------------
        mockMvc.perform(post("/api/sessions/" + sessionId + "/end")
                .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Verify Presence Restored (Both ONLINE)
        freshA = userRepository.findById(userA.getId()).get();
        freshB = userRepository.findById(userB.getId()).get();
        assertEquals(PresenceStatus.ONLINE, freshA.getPresenceStatus());
        assertEquals(PresenceStatus.ONLINE, freshB.getPresenceStatus());
    }

    @Test
    void testStartDuplicateSession_ShouldFail() throws Exception {
        // Setup: Completed Request
        SkillExchangeRequest req = seedAcceptedRequest();

        // 1. Start Session 1
        mockMvc.perform(post("/api/sessions")
                .header("Authorization", tokenA)
                .param("requestId", String.valueOf(req.getId()))
                .param("intent", "AUDIO_CALL"))
                .andExpect(status().isOk());

        // 2. Start Session 2 (Duplicate)
        mockMvc.perform(post("/api/sessions")
                .header("Authorization", tokenA)
                .param("requestId", String.valueOf(req.getId()))
                .param("intent", "AUDIO_CALL"))
                .andExpect(status().isBadRequest());
    }

    // --- Helpers ---
    private User createUser(String name, String providerId) {
        User u = new User();
        u.setName(name);
        u.setAuthProvider(AuthProvider.GOOGLE);
        u.setProviderUserId(providerId);
        u.setActive(true);
        u.setPresenceStatus(PresenceStatus.ONLINE);
        return userRepository.save(u);
    }

    private Skill createSkill(String name, String category) {
        Skill s = new Skill();
        s.setName(name);
        s.setCategory(category);
        return skillRepository.save(s);
    }

    private UserSkill createUserSkill(User u, Skill s, SkillType type) {
        UserSkill us = new UserSkill();
        us.setUser(u);
        us.setSkill(s);
        us.setSkillType(type);
        us.setLevel(SkillLevel.INTERMEDIATE);
        return userSkillRepository.save(us);
    }

    private SkillExchangeRequest seedAcceptedRequest() {
        SkillExchangeRequest req = new SkillExchangeRequest();
        req.setSender(userA);
        req.setReceiver(userB);
        req.setSenderSkill(skillA);
        req.setReceiverSkill(skillB);
        req.setStatus(ExchangeRequestStatus.ACCEPTED);
        return requestRepository.save(req);
    }

    // Reflection helper to set private fields on simple DTOs
    // (Dto classes in this project don't see setters, or I missed them in
    // view_file)
    private void setField(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
