package com.Project.Continuum.service;

import com.Project.Continuum.entity.PushSubscription;
import com.Project.Continuum.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.apache.http.HttpEntity;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.time.Instant;
import java.util.List;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

/**
 * ProdPushNotificationService - Real implementation for PROD.
 * 
 * Uses the webpush-java library for encryption and delivery.
 * Requires VAPID keys to be present.
 */
@Service
@Profile("prod")
public class ProdPushNotificationService implements PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ProdPushNotificationService.class);

    private final PushSubscriptionRepository subscriptionRepository;

    @Value("${push.vapid.public-key:#{null}}")
    private String vapidPublicKey;

    @Value("${push.vapid.private-key:#{null}}")
    private String vapidPrivateKey;

    @Value("${push.vapid.subject:#{null}}")
    private String vapidSubject;

    private PushService pushService;

    public ProdPushNotificationService(PushSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    public void init() {
        vapidPublicKey = normalizeVapidKey(vapidPublicKey);
        vapidPrivateKey = normalizeVapidKey(vapidPrivateKey);
        vapidSubject = vapidSubject != null ? vapidSubject.trim() : null;

        if (!StringUtils.hasText(vapidPublicKey) || !StringUtils.hasText(vapidPrivateKey) || !StringUtils.hasText(vapidSubject)) {
            log.warn("VAPID keys missing. Push notification service will be DISABLED.");
            return;
        }

        if (!isValidVapidPublicKey(vapidPublicKey) || !isValidVapidPrivateKey(vapidPrivateKey)) {
            log.warn("Invalid VAPID key format. Push notification service will be DISABLED.");
            return;
        }

        try {
            // Add BouncyCastle provider for encryption
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }

            pushService = new PushService();
            pushService.setPublicKey(vapidPublicKey);
            pushService.setPrivateKey(vapidPrivateKey);
            pushService.setSubject(vapidSubject);

            log.info("ProdPushNotificationService initialized with VAPID");
        } catch (Exception e) {
            log.error("Failed to initialize ProdPushNotificationService: {}", e.getMessage());
            // In PROD, we might want to throw here to fail fast, but logging error
            // preserves existing behavior (partially).
            // However, Spring @Value injection failure happens BEFORE this init if keys are
            // missing.
        }
    }

    @Override
    @Transactional
    public PushSubscription saveSubscription(Long userId, String endpoint, String p256dh, String auth) {
        PushSubscription existing = subscriptionRepository.findByEndpoint(endpoint).orElse(null);

        if (existing != null) {
            existing.setUserId(userId);
            existing.setP256dh(p256dh);
            existing.setAuth(auth);
            return subscriptionRepository.save(existing);
        }

        PushSubscription subscription = new PushSubscription();
        subscription.setUserId(userId);
        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);

        return subscriptionRepository.save(subscription);
    }

    @Override
    @Transactional
    public void removeSubscription(String endpoint) {
        subscriptionRepository.deleteByEndpoint(endpoint);
    }

    @Override
    public String getPublicKey() {
        return StringUtils.hasText(vapidPublicKey) ? vapidPublicKey : "";
    }

    @Override
    public void sendToUser(Long userId, String title, String body, String data) {
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);

        if (subscriptions.isEmpty()) {
            log.info("No push subscriptions for user {}", userId);
            return;
        }

        log.info("Attempting push delivery to user {} across {} subscription(s)", userId, subscriptions.size());
        String payload = buildPayload(title, body, data);

        for (PushSubscription sub : subscriptions) {
            sendPush(sub, payload);
        }
    }

    private void sendPush(PushSubscription sub, String payload) {
        if (pushService == null) {
            log.warn("PushService not initialized");
            return;
        }

        try {
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payload.getBytes(StandardCharsets.UTF_8));

            HttpResponse response = pushService.send(notification, Encoding.AES128GCM);
            int statusCode = response != null && response.getStatusLine() != null
                    ? response.getStatusLine().getStatusCode()
                    : -1;
            String reason = response != null && response.getStatusLine() != null
                    ? response.getStatusLine().getReasonPhrase()
                    : "unknown";

            if (statusCode >= 200 && statusCode < 300) {
                sub.setLastUsedAt(Instant.now());
                subscriptionRepository.save(sub);
                log.info("Push accepted for user {} endpoint {} (status={} {})",
                        sub.getUserId(),
                        sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())),
                        statusCode,
                        reason);
                return;
            }

            String responseBody = extractResponseBody(response);
            log.warn("Push rejected for endpoint {} (status={} {}, body={})",
                    sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())),
                    statusCode,
                    reason,
                    responseBody);

            if (isStaleStatusCode(statusCode)) {
                log.info("Removing stale subscription for user {}", sub.getUserId());
                subscriptionRepository.delete(sub);
            }

        } catch (Exception e) {
            log.warn("Push failed for endpoint {}: {}",
                    sub.getEndpoint().substring(0, Math.min(50, sub.getEndpoint().length())),
                    e.getMessage());

            String msg = e.getMessage() != null ? e.getMessage() : "";
            boolean staleSubscription =
                    msg.contains("410") || msg.contains("404")
                            || msg.toLowerCase().contains("gone") || msg.toLowerCase().contains("unsub");
            if (staleSubscription) {
                log.info("Removing expired subscription for user {}", sub.getUserId());
                subscriptionRepository.delete(sub);
            }
        }
    }

    private static boolean isStaleStatusCode(int statusCode) {
        return statusCode == 404 || statusCode == 410;
    }

    private static String extractResponseBody(HttpResponse response) {
        if (response == null) {
            return "";
        }
        HttpEntity entity = response.getEntity();
        if (entity == null) {
            return "";
        }
        try {
            String body = EntityUtils.toString(entity, StandardCharsets.UTF_8);
            if (body == null) {
                return "";
            }
            String trimmed = body.replaceAll("\\s+", " ").trim();
            return trimmed.length() > 300 ? trimmed.substring(0, 300) + "..." : trimmed;
        } catch (Exception ignored) {
            return "";
        }
    }

    private String buildPayload(String title, String body, String data) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"title\":\"").append(escapeJson(title)).append("\",");
        sb.append("\"body\":\"").append(escapeJson(body)).append("\"");
        if (data != null && !data.isEmpty()) {
            sb.append(",\"data\":").append(data);
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String s) {
        if (s == null)
            return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String normalizeVapidKey(String value) {
        if (value == null) {
            return null;
        }
        String key = value.trim();
        if ((key.startsWith("\"") && key.endsWith("\"")) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length() - 1);
        }
        return key
                .replaceAll("\\s+", "")
                .replace('+', '-')
                .replace('/', '_')
                .replaceAll("=+$", "");
    }

    private static boolean isValidVapidPublicKey(String key) {
        byte[] decoded = decodeBase64Url(key);
        return decoded != null && decoded.length == 65;
    }

    private static boolean isValidVapidPrivateKey(String key) {
        byte[] decoded = decodeBase64Url(key);
        return decoded != null && decoded.length == 32;
    }

    private static byte[] decodeBase64Url(String key) {
        try {
            String base64 = key.replace('-', '+').replace('_', '/');
            int padding = (4 - (base64.length() % 4)) % 4;
            String padded = base64 + "=".repeat(padding);
            return Base64.getDecoder().decode(padded);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
