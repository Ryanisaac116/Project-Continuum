package com.Project.Continuum;

import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.*;
import com.Project.Continuum.repository.*;
import com.Project.Continuum.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class FriendIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private SkillExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    private ExchangeSessionRepository exchangeSessionRepository;

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private User userC; // Stranger
    private String tokenA;
    private String tokenB;
    private String tokenC;

    @BeforeEach
    void setUp() {
        // Clear all data to ensure clean state
        friendRepository.deleteAll();
        exchangeSessionRepository.deleteAll();
        exchangeRequestRepository.deleteAll();
        userSkillRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        userA = createUser("User A", "userA_123");
        userB = createUser("User B", "userB_123");
        userC = createUser("User C", "userC_123");

        tokenA = "Bearer " + jwtUtil.generateToken(userA.getId());
        tokenB = "Bearer " + jwtUtil.generateToken(userB.getId());
        tokenC = "Bearer " + jwtUtil.generateToken(userC.getId());

        // 2. Create Skills
        Skill javaSkill = createSkill("Java", "Programming");

        // 3. Assign Skills (User A has Java, User B wants it)
        UserSkill skillA = createUserSkill(userA, javaSkill, SkillType.TEACH);
        UserSkill skillB = createUserSkill(userB, javaSkill, SkillType.LEARN);

        // 4. Create and COMPLETE an Exchange Session between A and B
        seedCompletedExchange(userA, userB, skillA, skillB);
    }

    @Test
    void testSendFriendRequest_Success() throws Exception {
        // User A sends friend request to User B
        mockMvc.perform(post("/api/friends/" + userB.getId() + "/request")
                .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // Verify PENDING state
        mockMvc.perform(get("/api/friends")
                .header("Authorization", tokenB)) // B checks friends
                .andExpect(status().isOk()); // Returns list, verified logic in next steps or simple ok check
    }

    @Test
    void testSendFriendRequest_Fail_Duplicate() throws Exception {
        // 1. Send first request
        mockMvc.perform(post("/api/friends/" + userB.getId() + "/request")
                .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // 2. Send duplicate request (Should fail)
        mockMvc.perform(post("/api/friends/" + userB.getId() + "/request")
                .header("Authorization", tokenA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAcceptFriendRequest_Success() throws Exception {
        // 1. A sends request
        mockMvc.perform(post("/api/friends/" + userB.getId() + "/request")
                .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // 2. B accepts request
        mockMvc.perform(post("/api/friends/" + userA.getId() + "/accept")
                .header("Authorization", tokenB))
                .andExpect(status().isOk());

        // 3. Verify they are friends (Chat accessible)
        mockMvc.perform(get("/api/chat/" + userB.getId())
                .header("Authorization", tokenA))
                .andExpect(status().isOk());
    }

    @Test
    void testChatAccess_Fail_NotFriends() throws Exception {
        // A tries to access chat with C (Stranger, No Session, No Friend Request)
        mockMvc.perform(get("/api/chat/" + userC.getId())
                .header("Authorization", tokenA))
                .andExpect(status().isForbidden()); // Or 400 depending on implementation, 403 typical
    }

    @Test
    void testSendFriendRequest_Fail_NoCompletedSession() throws Exception {
        // A tries to Add C (Stranger) without Session
        mockMvc.perform(post("/api/friends/" + userC.getId() + "/request")
                .header("Authorization", tokenA))
                .andExpect(status().isBadRequest());
    }

    // --- Helpers ---

    private User createUser(String name, String providerId) {
        User u = new User();
        u.setName(name);
        u.setAuthProvider("GOOGLE");
        u.setProviderUserId(providerId);
        u.setActive(true);
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

    private void seedCompletedExchange(User u1, User u2, UserSkill s1, UserSkill s2) {
        SkillExchangeRequest req = new SkillExchangeRequest();
        req.setSender(u1);
        req.setReceiver(u2);
        req.setSenderSkill(s1);
        req.setReceiverSkill(s2);
        req.setStatus(ExchangeRequestStatus.ACCEPTED);
        req = exchangeRequestRepository.save(req);

        ExchangeSession session = new ExchangeSession();
        session.setRequest(req);
        if (u1.getId() < u2.getId()) {
            session.setUserA(u1);
            session.setUserB(u2);
        } else {
            session.setUserA(u2);
            session.setUserB(u1);
        }
        session.setIntent(ExchangeIntent.AUDIO_CALL);
        session.setStatus(ExchangeStatus.COMPLETED); // KEY REQUIREMENT
        session.setStartedAt(LocalDateTime.now().minusHours(1));
        session.setEndedAt(LocalDateTime.now());
        exchangeSessionRepository.save(session);
    }
}
