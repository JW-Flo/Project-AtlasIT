-- Onboarding session tracking

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started', 'questions_generated', 'answers_submitted', 'provisioning', 'completed', 'failed')),
  industry TEXT,
  requirements TEXT, -- JSON array
  answers TEXT, -- JSON
  generated_config TEXT, -- JSON
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tenant ON onboarding_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
