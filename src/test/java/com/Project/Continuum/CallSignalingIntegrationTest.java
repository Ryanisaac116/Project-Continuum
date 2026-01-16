package com.Project.Continuum;

import com.Project.Continuum.enums.AuthProvider;

import com.Project.Continuum.controller.CallSignalingController;
import com.Project.Continuum.dto.call.CallSignalMessage;
import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.*;
import com.Project.Continuum.exception.AccessDeniedException;
import com.Project.Continuum.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CallSignalingIntegrationTest {

    @Autowired
    private CallSignalingController callSignalingController;

    @MockBean
    private SimpMessageSendingOperations messagingTemplate;

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

    private User userA;
    private User userB;
    private User userC; // Stranger
    private ExchangeSession activeSession;

    private Principal principalA;
    private Principal principalB;
    private Principal principalC;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        requestRepository.deleteAll();
        userSkillRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        userA = createUser("User A", "userA_sig");
        userB = createUser("User B", "userB_sig");
        userC = createUser("User C", "userC_sig");

        // 2. Setup Active Session A-B
        activeSession = seedActiveSession(userA, userB);

        // 3. Setup Principals (Manual Stub to avoid Mockito/JDK24 issues)
        principalA = new TestPrincipal(userA.getId().toString());
        principalB = new TestPrincipal(userB.getId().toString());
        principalC = new TestPrincipal(userC.getId().toString());
    }

    @Test
    void testSignalRouting_Success() {
        // A sends OFFER to B
        CallSignalMessage offerMsg = new CallSignalMessage();
        offerMsg.setType(CallSignalType.OFFER);
        offerMsg.setSessionId(activeSession.getId());
        offerMsg.setPayload("SDP_OFFER");
        offerMsg.setRecipientId(userB.getId());

        callSignalingController.handleSignal(offerMsg, principalA);

        // Verify routing to B
        verify(messagingTemplate).convertAndSendToUser(
                eq(String.valueOf(userB.getId())),
                eq("/queue/call-signal"),
                any(CallSignalMessage.class) // Checking exact match difficult due to object equality
        );
    }

    @Test
    void testSignalRouting_Unauthorized_Stranger() {
        // C tries to send OFFER to B (Not in session)
        CallSignalMessage offerMsg = new CallSignalMessage();
        offerMsg.setType(CallSignalType.OFFER);
        offerMsg.setSessionId(activeSession.getId());
        offerMsg.setPayload("SDP_OFFER_MALICIOUS");
        offerMsg.setRecipientId(userB.getId());

        assertThrows(AccessDeniedException.class, () -> {
            callSignalingController.handleSignal(offerMsg, principalC);
        });
    }

    @Test
    void testSignalRouting_Unauthorized_WrongSession() {
        // A tries to signal with a non-existent session ID
        CallSignalMessage offerMsg = new CallSignalMessage();
        offerMsg.setType(CallSignalType.OFFER);
        offerMsg.setSessionId(9999L);
        offerMsg.setPayload("SDP_OFFER");
        offerMsg.setRecipientId(userB.getId());

        // Should be RNF or Bad Request, checking Exception base
        assertThrows(RuntimeException.class, () -> {
            callSignalingController.handleSignal(offerMsg, principalA);
        });
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

    private ExchangeSession seedActiveSession(User u1, User u2) {
        // Create Request
        SkillExchangeRequest req = new SkillExchangeRequest();
        req.setSender(u1);
        req.setReceiver(u2);
        // Minimal fake skills for constraints
        Skill s = new Skill();
        s.setName("S");
        s.setCategory("C");
        skillRepository.save(s);
        UserSkill us1 = new UserSkill();
        us1.setUser(u1);
        us1.setSkill(s);
        us1.setSkillType(SkillType.TEACH);
        us1.setLevel(SkillLevel.EXPERT);
        userSkillRepository.save(us1);
        UserSkill us2 = new UserSkill();
        us2.setUser(u2);
        us2.setSkill(s);
        us2.setSkillType(SkillType.LEARN);
        us2.setLevel(SkillLevel.EXPERT);
        userSkillRepository.save(us2);
        req.setSenderSkill(us1);
        req.setReceiverSkill(us2);
        req.setStatus(ExchangeRequestStatus.ACCEPTED);
        req = requestRepository.save(req);

        // Create Session
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
        session.setStatus(ExchangeStatus.ACTIVE);
        session.setStartedAt(LocalDateTime.now());
        return sessionRepository.save(session);
    }

    // Manual Stub for Principal
    static class TestPrincipal implements Principal {
        private final String name;

        public TestPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
