-- Migration 0063: JML (Joiner/Mover/Leaver) tables — PostgreSQL port of 0018
-- Migration 0018 used SQLite datetime('now') syntax; this adds PG-compatible versions.

-- Per-tenant JML policy configuration
CREATE TABLE IF NOT EXISTS jml_policies (
  tenant_id         TEXT NOT NULL PRIMARY KEY,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  auto_joiner       BOOLEAN NOT NULL DEFAULT TRUE,
  auto_leaver       BOOLEAN NOT NULL DEFAULT TRUE,
  auto_mover        BOOLEAN NOT NULL DEFAULT TRUE,
  leaver_grace_ms   INTEGER NOT NULL DEFAULT 0,
  notify_manager    BOOLEAN NOT NULL DEFAULT TRUE,
  notify_user       BOOLEAN NOT NULL DEFAULT FALSE,
  require_joiner_approval BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Directory change log — captures every user state delta from sync
CREATE TABLE IF NOT EXISTS directory_changelog (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  email           TEXT,
  change_type     TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deactivated', 'deleted', 'reactivated')),
  delta           JSONB NOT NULL DEFAULT '{}',
  jml_action      TEXT CHECK (jml_action IN ('joiner', 'leaver', 'mover', 'rehire')),
  workflow_run_id TEXT,
  source          TEXT NOT NULL DEFAULT 'directory_sync',
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changelog_tenant ON directory_changelog (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_unprocessed ON directory_changelog (tenant_id, processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_changelog_user ON directory_changelog (tenant_id, user_id);

-- Workflow templates (canonical JML workflow definitions)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('joiner', 'leaver', 'mover', 'rehire', 'custom')),
  tenant_id   TEXT,
  definition  JSONB NOT NULL DEFAULT '{}',
  version     INTEGER NOT NULL DEFAULT 1,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_templates_type ON workflow_templates (type, active);
CREATE INDEX IF NOT EXISTS idx_wf_templates_tenant ON workflow_templates (tenant_id, type) WHERE tenant_id IS NOT NULL;

-- Workflow runs
CREATE TABLE IF NOT EXISTS workflow_runs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id    TEXT NOT NULL,
  type         TEXT NOT NULL,
  user_id      TEXT,
  email        TEXT,
  status       TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'compensating', 'cancelled')),
  trigger      TEXT NOT NULL DEFAULT 'jml_auto',
  changelog_id TEXT,
  steps_total  INTEGER NOT NULL DEFAULT 0,
  steps_done   INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms  INTEGER,
  error        TEXT,
  context      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_wf_runs_tenant ON workflow_runs (tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_runs_status ON workflow_runs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wf_runs_user ON workflow_runs (tenant_id, user_id);

-- Activity stream (append-only)
CREATE TABLE IF NOT EXISTS activity_stream (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  title       TEXT NOT NULL,
  detail      TEXT,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
  entity_type TEXT,
  entity_id   TEXT,
  actor       TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_tenant ON activity_stream (tenant_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_stream (tenant_id, entity_type, entity_id);
