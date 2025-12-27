package com.Project.Continuum.matching;

import com.Project.Continuum.enums.MatchDecisionType;

import java.util.List;

public class MatchDecision {

    private MatchDecisionType type;
    private List<MatchCandidate> candidates;
    private String message;

    public MatchDecision(
            MatchDecisionType type,
            List<MatchCandidate> candidates,
            String message) {

        this.type = type;
        this.candidates = candidates;
        this.message = message;
    }

    public MatchDecisionType getType() { return type; }
    public List<MatchCandidate> getCandidates() { return candidates; }
    public String getMessage() { return message; }
}
