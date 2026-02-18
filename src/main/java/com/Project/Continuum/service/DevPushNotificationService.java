package com.Project.Continuum.service;

import com.Project.Continuum.entity.PushSubscription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * DevPushNotificationService - NO-OP implementation for DEV.
 * 
 * Does strictly nothing. Requires no secrets.
 */
@Service
@Profile({ "dev", "test" })
public class DevPushNotificationService implements PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(DevPushNotificationService.class);

    @Value("${push.vapid.public-key:}")
    private String vapidPublicKey;

    @Override
    public PushSubscription saveSubscription(Long userId, String endpoint, String p256dh, String auth) {
        log.info("saveSubscription called for user {} (DEV NO-OP)", userId);
        PushSubscription subscription = new PushSubscription();
        subscription.setId(-1L);
        subscription.setUserId(userId);
        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        return subscription;
    }

    @Override
    public void removeSubscription(String endpoint) {
        log.info("removeSubscription called for endpoint {} (DEV NO-OP)", endpoint);
    }

    @Override
    public String getPublicKey() {
        return vapidPublicKey;
    }

    @Override
    public void sendToUser(Long userId, String title, String body, String data) {
        log.info("Push sent to user {} (DEV NO-OP): {} - {}", userId, title, body);
    }
}
