-- Policy management: versioned policies with approval workflow
-- Phase B of MVP Hardening Plan

CREATE TABLE IF NOT EXISTS policies (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  content     TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','pending_review','approved','archived')),
  created_by  TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenant_id, status);

CREATE TABLE IF NOT EXISTS policy_versions (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  policy_id   TEXT NOT NULL,
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  diff_summary TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (policy_id) REFERENCES policies(id)
);
CREATE INDEX IF NOT EXISTS idx_policy_versions ON policy_versions(policy_id, version);

CREATE TABLE IF NOT EXISTS policy_approvals (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  policy_id       TEXT NOT NULL,
  version         INTEGER NOT NULL,
  reviewer_email  TEXT NOT NULL,
  decision        TEXT NOT NULL DEFAULT 'pending'
    CHECK(decision IN ('pending','approved','rejected','changes_requested')),
  comment         TEXT,
  decided_at      TEXT,
  FOREIGN KEY (policy_id) REFERENCES policies(id)
);
CREATE INDEX IF NOT EXISTS idx_policy_approvals ON policy_approvals(policy_id, decision);
