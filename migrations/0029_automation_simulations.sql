-- Migration 0029: Track dry-run simulation history
-- Persists every automation rule simulation so users can review past dry-runs

CREATE TABLE IF NOT EXISTS automation_simulations (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id   TEXT NOT NULL,
  rule_id     TEXT NOT NULL,
  rule_name   TEXT NOT NULL,
  trigger_event TEXT NOT NULL,  -- JSON: the event used for simulation
  matched     INTEGER NOT NULL DEFAULT 0,  -- 1 if conditions matched
  actions_preview TEXT NOT NULL DEFAULT '[]',  -- JSON: actions that would execute
  condition_results TEXT,  -- JSON: per-condition evaluation details
  ran_by      TEXT,  -- email of user who ran the simulation
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_simulations_tenant ON automation_simulations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_simulations_rule ON automation_simulations(rule_id);
CREATE INDEX IF NOT EXISTS idx_simulations_created ON automation_simulations(created_at);
