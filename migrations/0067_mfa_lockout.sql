-- Migration 0067 — MFA rate-limiting / lockout columns
--
-- Adds failed_mfa_count + mfa_locked_until to mfa_enrollments so the login
-- endpoint can enforce lockout after repeated bad codes, mirroring the
-- password failed_login_count / locked_until pattern on users.

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS failed_mfa_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE mfa_enrollments
  ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMPTZ;
