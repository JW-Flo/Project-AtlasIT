-- Access review tables: campaign-based periodic entitlement review for IGA.
--
-- Campaigns define a review scope and due date.
-- Items represent one user+app pair to be reviewed within a campaign.
-- Decisions log each approve/revoke action for audit.

CREATE TABLE IF NOT EXISTS access_review_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',        -- 'all' | 'app:<id>' | 'department:<name>'
  status TEXT NOT NULL DEFAULT 'draft',     -- draft | active | completed | expired
  reviewer_policy TEXT NOT NULL DEFAULT 'manager',  -- 'manager' | 'owner' | 'peer'
  due_date TEXT,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_arc_tenant_status
  ON access_review_campaigns(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_arc_tenant_due
  ON access_review_campaigns(tenant_id, due_date);

-- items: one per user+app pair within a campaign
CREATE TABLE IF NOT EXISTS access_review_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  app_id TEXT NOT NULL,
  app_name TEXT,
  role TEXT,
  reviewer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | revoked | skipped
  decided_at TEXT,
  decided_by TEXT,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES access_review_campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_ari_campaign
  ON access_review_items(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_ari_tenant
  ON access_review_items(tenant_id, user_id);

-- decisions: append-only audit log of every approve/revoke action
CREATE TABLE IF NOT EXISTS access_review_decisions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL,                  -- 'approved' | 'revoked'
  decided_by TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (item_id) REFERENCES access_review_items(id)
);

CREATE INDEX IF NOT EXISTS idx_ard_campaign
  ON access_review_decisions(campaign_id, decided_at);
