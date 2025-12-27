package com.Project.Continuum.service;

import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.MatchDecisionType;
import com.Project.Continuum.enums.MatchIntent;
import com.Project.Continuum.enums.SkillType;
import com.Project.Continuum.matching.*;
import com.Project.Continuum.repository.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
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

    public MatchDecision findMatch(Long userId, MatchIntent intent) {

        /* =====================================================
           1️⃣ Validate user exists
           ===================================================== */
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        /* =====================================================
           2️⃣ Fetch LEARN skills ONLY
           ===================================================== */
        List<UserSkill> learnerSkills =
                userSkillRepository.findByUser_IdAndSkillType(
                        userId, SkillType.LEARN);

        // ❌ TC-M5 FIX: user has no LEARN skills
        if (learnerSkills.isEmpty()) {
            return new MatchDecision(
                    MatchDecisionType.NO_MATCH,
                    List.of(),
                    "No suitable users found. Try again later."
            );
        }

        List<MatchCandidate> candidates = new ArrayList<>();

        /* =====================================================
           3️⃣ Core matching logic
           ===================================================== */
        for (UserSkill learnerSkill : learnerSkills) {

            // ONLY teachers of the same skill
            List<UserSkill> teachers =
                    userSkillRepository.findBySkill_IdAndSkillType(
                            learnerSkill.getSkill().getId(),
                            SkillType.TEACH);

            for (UserSkill teacherSkill : teachers) {

                User teacher = teacherSkill.getUser();

                // 1️⃣ Self exclusion
                if (teacher.getId().equals(userId)) continue;

                // 2️⃣ Friend exclusion (ordered pair)
                Long a = Math.min(userId, teacher.getId());
                Long b = Math.max(userId, teacher.getId());

                if (friendRepository.existsByUser1_IdAndUser2_Id(a, b)) {
                    continue;
                }

                // 3️⃣ Level compatibility
                if (!teacherSkill.getLevel()
                        .canTeach(learnerSkill.getLevel())) {
                    continue;
                }

                String headline = profileRepository
                        .findByUser_Id(teacher.getId())
                        .map(UserProfile::getHeadline)
                        .orElse("");

                candidates.add(new MatchCandidate(
                        teacher.getId(),
                        teacher.getName(),
                        headline,
                        learnerSkill.getSkill().getName(),
                        teacherSkill.getLevel().name()
                ));
            }
        }

        /* =====================================================
           4️⃣ Final empty-result guard
           ===================================================== */
        if (candidates.isEmpty()) {
            return new MatchDecision(
                    MatchDecisionType.NO_MATCH,
                    List.of(),
                    "No suitable users found. Try again later."
            );
        }

        /* =====================================================
           5️⃣ SUCCESS
           ===================================================== */
        return new MatchDecision(
                MatchDecisionType.OFFLINE_CANDIDATE_FOUND,
                candidates,
                "Suitable users found"
        );
    }
}
