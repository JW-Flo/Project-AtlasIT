-- Migration 0013: Automation rules engine for tenant environment management
-- Enables tenants to define event-driven rules (trigger → condition → action)

CREATE TABLE IF NOT EXISTS automation_rules (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  enabled     INTEGER NOT NULL DEFAULT 1,

  -- Trigger: what event fires this rule
  trigger_type TEXT NOT NULL CHECK(trigger_type IN (
    'user_joined_group',
    'user_left_group',
    'user_created',
    'user_deactivated',
    'app_connected',
    'app_disconnected',
    'app_health_changed',
    'schedule',
    'compliance_score_changed'
  )),
  trigger_config TEXT NOT NULL DEFAULT '{}',  -- JSON: group_id, app_id, cron, threshold, etc.

  -- Conditions: optional filters (JSON array of condition objects)
  conditions TEXT NOT NULL DEFAULT '[]',

  -- Actions: what to do when triggered (JSON array of action objects)
  actions TEXT NOT NULL DEFAULT '[]',

  -- Execution tracking
  last_run_at   TEXT,
  last_status   TEXT CHECK(last_status IN ('success', 'partial', 'failed') OR last_status IS NULL),
  run_count     INTEGER NOT NULL DEFAULT 0,
  error_count   INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(tenant_id, enabled);

-- Execution history for automation rules
CREATE TABLE IF NOT EXISTS automation_executions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id    TEXT NOT NULL,
  rule_id      TEXT NOT NULL,
  trigger_event TEXT NOT NULL,  -- JSON: the event that triggered execution
  status       TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'partial', 'failed')),
  actions_run  INTEGER NOT NULL DEFAULT 0,
  actions_failed INTEGER NOT NULL DEFAULT 0,
  results      TEXT,  -- JSON array of action results
  duration_ms  INTEGER,
  started_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_automation_exec_tenant ON automation_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_started ON automation_executions(started_at);

-- Environment health snapshots for connected apps
CREATE TABLE IF NOT EXISTS app_health_checks (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  app_id      TEXT NOT NULL,
  healthy     INTEGER NOT NULL,
  response_ms INTEGER,
  error_msg   TEXT,
  details     TEXT,  -- JSON: additional health info (user_count, license_usage, etc.)
  checked_at  TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_tenant_app ON app_health_checks(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked ON app_health_checks(checked_at);
