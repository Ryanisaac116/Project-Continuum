-- Migration: Fix historical data offset (MST -> UTC)
-- Date: 2026-01-16
-- Description: Shifts timestamps created before UTC enforcement by +7 hours.
-- This corrects data that was stored as "Local MST" but is now interpreted as "UTC".

-- 1. Chat Messages
UPDATE chat_messages 
SET sent_at = DATE_ADD(sent_at, INTERVAL 7 HOUR)
WHERE sent_at < '2026-01-16 17:00:00' -- Apply only to old data
  AND sent_at > '2020-01-01 00:00:00'; -- Sanity check

-- 2. Call Sessions
UPDATE call_sessions
SET initiated_at = DATE_ADD(initiated_at, INTERVAL 7 HOUR),
    accepted_at = DATE_ADD(accepted_at, INTERVAL 7 HOUR),
    ended_at = DATE_ADD(ended_at, INTERVAL 7 HOUR)
WHERE initiated_at < '2026-01-16 17:00:00';

-- 3. Notifications
UPDATE notifications
SET created_at = DATE_ADD(created_at, INTERVAL 7 HOUR)
WHERE created_at < '2026-01-16 17:00:00';

-- 4. Exchange Sessions
UPDATE exchange_sessions
SET started_at = DATE_ADD(started_at, INTERVAL 7 HOUR),
    ended_at = DATE_ADD(ended_at, INTERVAL 7 HOUR),
    created_at = DATE_ADD(created_at, INTERVAL 7 HOUR)
WHERE created_at < '2026-01-16 17:00:00';
