package com.Project.Continuum.service;

import com.Project.Continuum.dto.userskill.UserSkillCreateRequest;
import com.Project.Continuum.dto.userskill.UserSkillResponse;
import com.Project.Continuum.dto.userskill.UserSkillUpdateRequest;
import com.Project.Continuum.entity.Skill;
import com.Project.Continuum.entity.User;
import com.Project.Continuum.entity.UserSkill;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.SkillRepository;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserSkillService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;

    public UserSkillService(
            UserRepository userRepository,
            SkillRepository skillRepository,
            UserSkillRepository userSkillRepository
    ) {
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
    }

    // ---------------- ADD SKILL ----------------

    public UserSkillResponse addSkill(Long userId, UserSkillCreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));

        userSkillRepository
                .findByUser_IdAndSkill_IdAndSkillType(
                        userId,
                        request.getSkillId(),
                        request.getSkillType()
                )
                .ifPresent(us -> {
                    throw new BadRequestException("Skill already added for this user");
                });

        UserSkill userSkill = new UserSkill();
        userSkill.setUser(user);
        userSkill.setSkill(skill);
        userSkill.setLevel(request.getLevel());
        userSkill.setSkillType(request.getSkillType());

        return mapToResponse(userSkillRepository.save(userSkill));
    }

    // ---------------- GET USER SKILLS ----------------

    @Transactional(readOnly = true)
    public List<UserSkillResponse> getUserSkills(Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return userSkillRepository.findByUser_Id(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ---------------- UPDATE USER SKILL ----------------

    public UserSkillResponse updateUserSkill(
            Long userId,
            Long userSkillId,
            UserSkillUpdateRequest request
    ) {

        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("User skill not found"));

        if (!userSkill.getUser().getId().equals(userId)) {
            throw new BadRequestException("Skill does not belong to user");
        }

        if (request.getLevel() != null) {
            userSkill.setLevel(request.getLevel());
        }

        if (request.getSkillType() != null &&
                request.getSkillType() != userSkill.getSkillType()) {

            userSkillRepository
                    .findByUser_IdAndSkill_IdAndSkillType(
                            userId,
                            userSkill.getSkill().getId(),
                            request.getSkillType()
                    )
                    .ifPresent(us -> {
                        throw new BadRequestException(
                                "User already has this skill with the given type"
                        );
                    });

            userSkill.setSkillType(request.getSkillType());
        }

        return mapToResponse(userSkillRepository.save(userSkill));
    }

    // ---------------- DELETE USER SKILL ----------------

    public void deleteUserSkill(Long userId, Long userSkillId) {

        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("User skill not found"));

        if (!userSkill.getUser().getId().equals(userId)) {
            throw new BadRequestException("Skill does not belong to user");
        }

        userSkillRepository.delete(userSkill);
    }

    // ---------------- MAPPER ----------------

    private UserSkillResponse mapToResponse(UserSkill us) {
        return new UserSkillResponse(
                us.getId(),
                us.getSkill().getName(),
                us.getSkill().getCategory(),
                us.getLevel().name(),
                us.getSkillType().name()
        );
    }
}
