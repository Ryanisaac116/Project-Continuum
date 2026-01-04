package com.Project.Continuum;

import com.Project.Continuum.dto.profile.UserProfileUpdateRequest;
import com.Project.Continuum.dto.users.UserUpdateRequest;
import com.Project.Continuum.dto.userskill.UserSkillCreateRequest;
import com.Project.Continuum.entity.Skill;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.entity.UserProfile;
import com.Project.Continuum.entity.UserSkill;
import com.Project.Continuum.enums.SkillLevel;
import com.Project.Continuum.enums.SkillType;
import com.Project.Continuum.repository.SkillRepository;
import com.Project.Continuum.repository.UserProfileRepository;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.repository.UserSkillRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private String authToken;
    private Skill testSkill;

    @BeforeEach
    void setUp() {
        userSkillRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();
        skillRepository.deleteAll();

        // 1. Create User
        testUser = new User();
        testUser.setName("Integration Tester");
        testUser.setAuthProvider("GOOGLE");
        testUser.setProviderUserId("int_test_123");
        testUser.setActive(true);
        testUser = userRepository.save(testUser);

        // 2. Create Profile
        UserProfile profile = new UserProfile();
        profile.setUser(testUser);
        profile.setHeadline("Newbie");
        userProfileRepository.save(profile);

        // 3. Create Skill
        testSkill = new Skill();
        testSkill.setName("Integration Testing");
        testSkill.setCategory("QA");
        testSkill = skillRepository.save(testSkill);

        authToken = "Bearer " + jwtUtil.generateToken(testUser.getId());
    }

    @Test
    void testFetchCurrentUser() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(testUser.getName()))
                .andExpect(jsonPath("$.id").value(testUser.getId()));
    }

    @Test
    void testUpdateUserProfile() throws Exception {
        UserUpdateRequest userUpdate = new UserUpdateRequest();
        userUpdate.setName("Updated Tester");
        userUpdate.setBio("Testing is life.");

        mockMvc.perform(put("/api/users/me")
                .header("Authorization", authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(userUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Tester")); // Assuming API returns updated user

        UserProfileUpdateRequest profileUpdate = new UserProfileUpdateRequest();
        profileUpdate.setHeadline("Senior QA");
        profileUpdate.setAbout("I break code.");

        mockMvc.perform(put("/api/profile")
                .header("Authorization", authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Senior QA"));
    }

    @Test
    void testAddAndRemoveUserSkill() throws Exception {
        UserSkillCreateRequest addRequest = new UserSkillCreateRequest();
        addRequest.setSkillId(testSkill.getId());
        addRequest.setLevel(SkillLevel.EXPERT);
        addRequest.setSkillType(SkillType.TEACH);

        String desc = mockMvc.perform(post("/api/user-skills")
                .header("Authorization", authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillName").value(testSkill.getName()))
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(desc);
        Integer userSkillId = node.get("id").asInt();

        List<UserSkill> skills = userSkillRepository.findByUser_Id(testUser.getId());
        assertEquals(1, skills.size());

        mockMvc.perform(delete("/api/user-skills/" + userSkillId)
                .header("Authorization", authToken))
                .andExpect(status().isOk());

        skills = userSkillRepository.findByUser_Id(testUser.getId());
        assertEquals(0, skills.size());
    }
}
