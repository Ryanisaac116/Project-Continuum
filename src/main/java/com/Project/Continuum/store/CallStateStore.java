package com.Project.Continuum.store;

import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CallStateStore {

    // sessionId -> timestamp (System.currentTimeMillis())
    private final ConcurrentHashMap<Long, Long> sessionHeartbeats = new ConcurrentHashMap<>();

    public void updateHeartbeat(Long sessionId) {
        sessionHeartbeats.put(sessionId, System.currentTimeMillis());
    }

    public Long getLastHeartbeat(Long sessionId) {
        return sessionHeartbeats.get(sessionId);
    }

    public void removeSession(Long sessionId) {
        sessionHeartbeats.remove(sessionId);
    }

    public Set<Long> getActiveSessionIds() {
        return sessionHeartbeats.keySet();
    }
}
