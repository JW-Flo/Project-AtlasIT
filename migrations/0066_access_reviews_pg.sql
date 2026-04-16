-- PG version of access_review tables (from SQLite 0021).
-- Campaigns define a review scope and due date.
-- Items represent one user+app pair to be reviewed within a campaign.
-- Decisions log each approve/revoke action for audit.

CREATE TABLE IF NOT EXISTS access_review_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft',
  reviewer_policy TEXT NOT NULL DEFAULT 'manager',
  due_date TIMESTAMPTZ,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_arc_tenant_status ON access_review_campaigns(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_arc_tenant_due ON access_review_campaigns(tenant_id, due_date);

CREATE TABLE IF NOT EXISTS access_review_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES access_review_campaigns(id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  app_id TEXT NOT NULL,
  app_name TEXT,
  role TEXT,
  reviewer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ari_campaign ON access_review_items(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_ari_tenant ON access_review_items(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS access_review_decisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id TEXT NOT NULL REFERENCES access_review_items(id),
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ard_campaign ON access_review_decisions(campaign_id, decided_at);
