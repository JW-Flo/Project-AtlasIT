-- Incident lifecycle: ownership, status tracking, SLA enforcement, timeline
-- Phase A1 of MVP Hardening Plan

-- Add owner assignment and SLA tracking columns
ALTER TABLE incidents ADD COLUMN owner_id TEXT;
ALTER TABLE incidents ADD COLUMN owner_email TEXT;
ALTER TABLE incidents ADD COLUMN investigating_at TEXT;
ALTER TABLE incidents ADD COLUMN sla_breach_at TEXT;
ALTER TABLE incidents ADD COLUMN sla_breach_notified INTEGER DEFAULT 0;

-- Incident timeline: comments, status changes, assignments, auto-actions
CREATE TABLE IF NOT EXISTS incident_timeline (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  incident_id TEXT NOT NULL,
  tenant_id   TEXT NOT NULL,
  entry_type  TEXT NOT NULL
    CHECK(entry_type IN ('comment','status_change','assignment','sla_warning','auto_action')),
  actor_email TEXT,
  content     TEXT,
  metadata    TEXT,  -- JSON for structured data (old_status, new_status, etc.)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (incident_id) REFERENCES incidents(id)
);
CREATE INDEX IF NOT EXISTS idx_incident_timeline ON incident_timeline(incident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_tenant ON incident_timeline(tenant_id);
