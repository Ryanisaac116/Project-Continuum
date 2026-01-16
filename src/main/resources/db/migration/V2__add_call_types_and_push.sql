-- Migration: Add call type and screen share columns to call_sessions
-- Date: 2026-01-14
-- Description: Adds columns for two-call-type architecture and screen sharing

-- Add call_type column (FRIEND or EXCHANGE)
ALTER TABLE call_sessions 
ADD COLUMN call_type VARCHAR(20) DEFAULT 'FRIEND' NOT NULL;

-- Add exchange_session_id foreign key (nullable, only used for EXCHANGE calls)
ALTER TABLE call_sessions 
ADD COLUMN exchange_session_id BIGINT NULL;

-- Add foreign key constraint
ALTER TABLE call_sessions
ADD CONSTRAINT fk_call_session_exchange 
FOREIGN KEY (exchange_session_id) REFERENCES exchange_sessions(id);

-- Add screen_share_active flag
ALTER TABLE call_sessions 
ADD COLUMN screen_share_active BOOLEAN DEFAULT FALSE NOT NULL;

-- Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    endpoint VARCHAR(500) NOT NULL UNIQUE,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    last_used_at DATETIME NULL
);

-- Index for faster user lookups
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
