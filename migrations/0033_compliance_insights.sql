-- Phase 13: Compliance Intelligence insights storage
-- Stores gap analysis results, drift alerts, and risk anomalies
CREATE TABLE IF NOT EXISTS compliance_insights (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,  -- 'gap', 'drift', 'anomaly'
  severity TEXT NOT NULL,      -- 'critical', 'high', 'medium', 'low'
  category TEXT,               -- sub-type (e.g., 'stale_evidence', 'bulk_escalation')
  data TEXT NOT NULL,          -- JSON payload
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_insights_tenant_type
  ON compliance_insights(tenant_id, insight_type, created_at);

CREATE INDEX IF NOT EXISTS idx_insights_severity
  ON compliance_insights(tenant_id, severity);
