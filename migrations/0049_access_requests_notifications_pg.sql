-- PostgreSQL migration: access_requests + notifications tables
-- Enables the 6 compliance-api routes that currently return 501

-- ── Access Requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  requester_email TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_name TEXT,
  justification TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_tenant
  ON access_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_tenant_status
  ON access_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_tenant_created
  ON access_requests(tenant_id, created_at DESC);

-- ── Notifications (PG version of 0042) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  channel TEXT NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT DEFAULT 'info',
  source_type TEXT,
  source_id TEXT,
  source_label TEXT,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user
  ON notifications(tenant_id, user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_unread
  ON notifications(tenant_id, user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created
  ON notifications(tenant_id, created_at DESC);
