package com.Project.Continuum.service;

import com.Project.Continuum.entity.PushSubscription;

public interface PushNotificationService {
    PushSubscription saveSubscription(Long userId, String endpoint, String p256dh, String auth);

    void removeSubscription(String endpoint);

    String getPublicKey();

    void sendToUser(Long userId, String title, String body, String data);
}
