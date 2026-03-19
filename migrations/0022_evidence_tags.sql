-- Evidence tags for categorization and flagging
CREATE TABLE IF NOT EXISTS evidence_tags (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  tag_type TEXT NOT NULL DEFAULT 'label',  -- 'label', 'flag', 'priority', 'status'
  color TEXT,                               -- hex color for UI
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (evidence_id) REFERENCES compliance_evidence(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_tags_tenant ON evidence_tags(tenant_id, evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tags_tag ON evidence_tags(tenant_id, tag, tag_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_tags_unique ON evidence_tags(tenant_id, evidence_id, tag, tag_type);
