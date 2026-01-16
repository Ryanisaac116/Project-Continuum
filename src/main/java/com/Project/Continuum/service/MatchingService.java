package com.Project.Continuum.service;

import com.Project.Continuum.dto.MatchingRequest;
import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.MatchDecisionType;
import com.Project.Continuum.enums.MatchIntent;
import com.Project.Continuum.enums.SkillType;
import com.Project.Continuum.enums.PresenceStatus;
import com.Project.Continuum.matching.*;
import com.Project.Continuum.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MatchingService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final FriendRepository friendRepository;
    private final UserProfileRepository profileRepository;

    public MatchingService(
            UserRepository userRepository,
            UserSkillRepository userSkillRepository,
            FriendRepository friendRepository,
            UserProfileRepository profileRepository) {

        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.friendRepository = friendRepository;
        this.profileRepository = profileRepository;
    }

    public MatchDecision findMatch(Long userId, MatchingRequest request) {

        /*
         * =====================================================
         * 1️⃣ Validate user exists
         * =====================================================
         */
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        /*
         * =====================================================
         * 2️⃣ STRICT VALIDATION (Category, Ownership, Reciprocity)
         * =====================================================
         */
        UserSkill teachSkill = userSkillRepository
                .findByUser_IdAndSkill_IdAndSkillType(userId, request.getTeachSkillId(), SkillType.TEACH)
                .orElseThrow(() -> new IllegalArgumentException(
                        "You do not possess the specified Teach skill: " + request.getTeachSkillId()));

        UserSkill learnSkill = userSkillRepository
                .findByUser_IdAndSkill_IdAndSkillType(userId, request.getLearnSkillId(), SkillType.LEARN)
                .orElseThrow(() -> new IllegalArgumentException(
                        "You do not possess the specified Learn skill: " + request.getLearnSkillId()));

        if (!teachSkill.getSkill().getCategory().equals(request.getCategory())) {
            throw new IllegalArgumentException("Teach skill category mismatch. Expected: " + request.getCategory());
        }

        if (!learnSkill.getSkill().getCategory().equals(request.getCategory())) {
            throw new IllegalArgumentException("Learn skill category mismatch. Expected: " + request.getCategory());
        }

        if (teachSkill.getSkill().getId().equals(learnSkill.getSkill().getId())) {
            throw new IllegalArgumentException("Teach and Learn skills cannot be the same.");
        }

        List<MatchCandidate> candidates = new ArrayList<>();

        /*
         * =====================================================
         * 3️⃣ Core matching logic
         * =====================================================
         */
        /*
         * =====================================================
         * 3️⃣ Core matching logic (TARGETED)
         * =====================================================
         */
        // Find users who:
        // 1. TEACH what I want to LEARN (request.learnSkillId)
        // 2. LEARN what I can TEACH (request.teachSkillId) - implied check, but we
        // filter candidates by this reciprocity
        // 3. Are in the SAME category (implied by skill IDs being correct)

        List<UserSkill> potentialPartners = userSkillRepository.findBySkill_IdAndSkillType(
                request.getLearnSkillId(),
                SkillType.TEACH);

        for (UserSkill partnerTeachSkill : potentialPartners) {

            User partner = partnerTeachSkill.getUser();

            // 1️⃣ Self exclusion
            if (partner.getId().equals(userId))
                continue;

            // 2️⃣ Friend exclusion
            Long a = Math.min(userId, partner.getId());
            Long b = Math.max(userId, partner.getId());
            if (friendRepository.existsByUser1_IdAndUser2_Id(a, b)) {
                continue;
            }

            // 3️⃣ Presence check
            if (partner.getPresenceStatus() != PresenceStatus.ONLINE) {
                continue;
            }

            // 4️⃣ Strict Reciprocity Check: Does Partner want to LEARN what I TEACH?
            boolean partnerWantsToLearnMySkill = userSkillRepository.existsByUser_IdAndSkill_IdAndSkillType(
                    partner.getId(),
                    request.getTeachSkillId(),
                    SkillType.LEARN);

            if (!partnerWantsToLearnMySkill) {
                continue;
            }

            // 5️⃣ Level compatibility (Partner teaches >= My needs)
            // Note: In a real app we'd compare levels. For now, we assume if they teach it,
            // it's ok.
            // Or we can check partnerTeachSkill.getLevel() vs learnSkill.getLevel()

            String headline = profileRepository
                    .findByUser_Id(partner.getId())
                    .map(UserProfile::getHeadline)
                    .orElse("");

            candidates.add(new MatchCandidate(
                    partner.getId(),
                    partner.getName(),
                    headline,
                    partnerTeachSkill.getSkill().getName(), // Skill they teach (my learn goal)
                    partnerTeachSkill.getSkill().getCategory(),
                    partnerTeachSkill.getLevel().name()));
        }

        /*
         * =====================================================
         * 4️⃣ Final empty-result guard
         * =====================================================
         */
        if (candidates.isEmpty()) {
            return new MatchDecision(
                    MatchDecisionType.NO_MATCH,
                    List.of(),
                    "No suitable users found. Try again later.");
        }

        /*
         * =====================================================
         * 5️⃣ SUCCESS
         * =====================================================
         */
        return new MatchDecision(
                MatchDecisionType.ONLINE_CANDIDATE_FOUND, // ✅ UPDATED SEMANTICS
                candidates,
                "Suitable online users found");
    }
}
