-- Migration 0056 — Invitation tokens
--
-- Token-based accept-invite flow. Admin invites a user, we create their
-- row with NULL password_hash + a single-use hashed token the invitee
-- uses to set their initial password. 7-day expiry.

CREATE TABLE IF NOT EXISTS invitation_tokens (
  token_hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  invited_by_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_tenant ON invitation_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_user ON invitation_tokens(user_id);
