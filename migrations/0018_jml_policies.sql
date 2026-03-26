-- Zero-config JML (Joiner/Mover/Leaver) policies and workflow tracking
-- JML operates automatically based on directory changes + group→app mappings.
-- No manual rule configuration needed.

-- Per-tenant JML policy configuration (opt-out, not opt-in)
CREATE TABLE IF NOT EXISTS jml_policies (
  tenant_id   TEXT NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  -- Auto-joiner: provision apps when new active user detected
  auto_joiner INTEGER NOT NULL DEFAULT 1,
  -- Auto-leaver: revoke apps when user deactivated/deleted
  auto_leaver INTEGER NOT NULL DEFAULT 1,
  -- Auto-mover: re-provision when department/group changes
  auto_mover  INTEGER NOT NULL DEFAULT 1,
  -- Grace period (ms) before leaver revocation executes
  leaver_grace_ms INTEGER NOT NULL DEFAULT 0,
  -- Notify manager on JML events
  notify_manager INTEGER NOT NULL DEFAULT 1,
  -- Notify user on JML events
  notify_user    INTEGER NOT NULL DEFAULT 0,
  -- Require approval for joiner provisioning (false = auto-approve)
  require_joiner_approval INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id)
);

-- Directory change log — captures every user state delta from sync
CREATE TABLE IF NOT EXISTS directory_changelog (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  email       TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deactivated', 'deleted', 'reactivated')),
  -- What changed (JSON): {field: {old, new}} for updates; full profile for created
  delta       TEXT NOT NULL DEFAULT '{}',
  -- JML classification derived from change
  jml_action  TEXT CHECK (jml_action IN ('joiner', 'leaver', 'mover', 'rehire', NULL)),
  -- Workflow run ID if a workflow was triggered
  workflow_run_id TEXT,
  source      TEXT NOT NULL DEFAULT 'directory_sync',
  processed   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_changelog_tenant ON directory_changelog(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_unprocessed ON directory_changelog(tenant_id, processed) WHERE processed = 0;
CREATE INDEX IF NOT EXISTS idx_changelog_user ON directory_changelog(tenant_id, user_id);

-- Workflow templates (canonical JML workflow definitions)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('joiner', 'leaver', 'mover', 'rehire', 'custom')),
  tenant_id   TEXT,  -- NULL = system-default template
  definition  TEXT NOT NULL,  -- JSON WorkflowDefinition
  version     INTEGER NOT NULL DEFAULT 1,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wf_templates_type ON workflow_templates(type, active);
CREATE INDEX IF NOT EXISTS idx_wf_templates_tenant ON workflow_templates(tenant_id, type) WHERE tenant_id IS NOT NULL;

-- Workflow run log (lightweight tracking in D1, full state in DO)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  type        TEXT NOT NULL,
  user_id     TEXT,
  email       TEXT,
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'compensating')),
  trigger     TEXT NOT NULL DEFAULT 'jml_auto',  -- jml_auto | manual | schedule | api
  changelog_id TEXT,  -- FK to directory_changelog if JML-triggered
  steps_total INTEGER NOT NULL DEFAULT 0,
  steps_done  INTEGER NOT NULL DEFAULT 0,
  started_at  TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_ms  INTEGER,
  error       TEXT,
  context     TEXT DEFAULT '{}',
  FOREIGN KEY (changelog_id) REFERENCES directory_changelog(id)
);

CREATE INDEX IF NOT EXISTS idx_wf_runs_tenant ON workflow_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_runs_status ON workflow_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wf_runs_user ON workflow_runs(tenant_id, user_id);

-- Real-time activity stream (append-only, consumed by SSE)
CREATE TABLE IF NOT EXISTS activity_stream (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL,  -- jml.joiner_started, workflow.step_completed, automation.rule_fired, etc.
  title       TEXT NOT NULL,
  detail      TEXT,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
  entity_type TEXT,  -- workflow_run, automation_execution, user, app
  entity_id   TEXT,
  actor       TEXT,  -- system | user email
  metadata    TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_tenant ON activity_stream(tenant_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_stream(tenant_id, entity_type, entity_id);
