-- Migration 0067 — MFA rate-limiting / lockout + pending re-enrollment
--
-- Adds failed_mfa_count + mfa_locked_until so the login endpoint can enforce
-- lockout after repeated bad codes (mirrors the password failed_login_count /
-- locked_until pattern on users), and pending_secret / pending_started_at so
-- re-enrollment can be staged without invalidating the active authenticator
-- and recovery codes until the new code is confirmed.

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS failed_mfa_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMPTZ;

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS pending_secret TEXT;

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS pending_started_at TIMESTAMPTZ;
