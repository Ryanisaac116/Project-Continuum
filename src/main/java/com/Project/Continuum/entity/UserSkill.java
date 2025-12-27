package com.Project.Continuum.entity;
import com.Project.Continuum.enums.SkillLevel;
import com.Project.Continuum.enums.SkillType;
import jakarta.persistence.*;


@Entity
@Table(
        name = "user_skills",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "skill_id", "skill_type"})
        }
)
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillLevel level;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false)
    private SkillType skillType;

    public UserSkill() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Skill getSkill() { return skill; }
    public SkillLevel getLevel() { return level; }
    public SkillType getSkillType() { return skillType; }

    public void setUser(User user) { this.user = user; }
    public void setSkill(Skill skill) { this.skill = skill; }
    public void setLevel(SkillLevel level) { this.level = level; }
    public void setSkillType(SkillType skillType) { this.skillType = skillType; }
}

