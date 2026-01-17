-- Migration: Fix timestamp precision to support milliseconds (ISO-8601)
-- Date: 2026-01-16
-- Description: Updates all DATETIME columns to DATETIME(6) to prevent millisecond truncation.

-- 1. Call Sessions
ALTER TABLE call_sessions 
MODIFY COLUMN initiated_at DATETIME(6) NOT NULL,
MODIFY COLUMN accepted_at DATETIME(6) NULL,
MODIFY COLUMN ended_at DATETIME(6) NULL;

-- 2. Chat Messages
ALTER TABLE chat_messages
MODIFY COLUMN sent_at DATETIME(6) NOT NULL,
MODIFY COLUMN edited_at DATETIME(6) NULL;

-- 3. Notifications
ALTER TABLE notifications
MODIFY COLUMN created_at DATETIME(6) NOT NULL;

-- 4. Exchange Sessions
ALTER TABLE exchange_sessions
MODIFY COLUMN started_at DATETIME(6) NOT NULL,
MODIFY COLUMN ended_at DATETIME(6) NULL,
MODIFY COLUMN created_at DATETIME(6) NOT NULL;

-- 5. Push Subscriptions
ALTER TABLE push_subscriptions
MODIFY COLUMN created_at DATETIME(6) NOT NULL,
MODIFY COLUMN last_used_at DATETIME(6) NULL;
