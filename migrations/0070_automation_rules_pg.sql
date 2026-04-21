-- PostgreSQL migration for automation_rules tables (from SQLite 0013)
-- Creates tables + fixes any unnamed rules from legacy data

CREATE TABLE IF NOT EXISTS automation_rules (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  description TEXT,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,

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
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Conditions: optional filters (JSON array of condition objects)
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Actions: what to do when triggered (JSON array of action objects)
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Execution tracking
  last_run_at   TIMESTAMPTZ,
  last_status   TEXT CHECK(last_status IN ('success', 'partial', 'failed') OR last_status IS NULL),
  run_count     INTEGER NOT NULL DEFAULT 0,
  error_count   INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(tenant_id, enabled);

-- Execution history for automation rules
CREATE TABLE IF NOT EXISTS automation_executions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id),
  rule_id      TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_event JSONB NOT NULL,
  status       TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'partial', 'failed')),
  actions_run  INTEGER NOT NULL DEFAULT 0,
  actions_failed INTEGER NOT NULL DEFAULT 0,
  results      JSONB,
  duration_ms  INTEGER,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_exec_tenant ON automation_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_started ON automation_executions(started_at);

-- Environment health snapshots for connected apps
CREATE TABLE IF NOT EXISTS app_health_checks (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  app_id      TEXT NOT NULL,
  healthy     BOOLEAN NOT NULL,
  response_ms INTEGER,
  error_msg   TEXT,
  details     JSONB,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_tenant_app ON app_health_checks(tenant_id, app_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked ON app_health_checks(checked_at);

-- Data fix: Set names for any unnamed rules
-- Uses trigger_type as fallback name to make them identifiable
UPDATE automation_rules
SET name = CONCAT('Automation rule (', trigger_type, ')')
WHERE name IS NULL OR name = '';

-- Add NOT NULL constraint if it wasn't already applied
ALTER TABLE automation_rules ALTER COLUMN name SET NOT NULL;
