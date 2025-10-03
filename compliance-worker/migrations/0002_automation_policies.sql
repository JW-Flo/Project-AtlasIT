-- D1 schema expansion for automation workflows and policy management

-- Workflow automation tables
CREATE TABLE IF NOT EXISTS workflow_templates (
  type TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  subject_ref TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER DEFAULT 0,
  idempotency_key TEXT,
  context_json TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_exec_tenant_created
  ON workflow_executions (tenant_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_exec_idempotent
  ON workflow_executions (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS workflow_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  output_json TEXT,
  error TEXT,
  started_at TEXT,
  completed_at TEXT,
  duration_ms INTEGER DEFAULT 0,
  FOREIGN KEY(execution_id) REFERENCES workflow_executions(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_execution
  ON workflow_steps (execution_id, id ASC);

-- Policy management tables
CREATE TABLE IF NOT EXISTS policy_templates (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generated_policies (
  hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  template_key TEXT NOT NULL,
  content TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  input_canonical TEXT NOT NULL,
  created_at TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_context
  ON generated_policies (tenant_id, template_key, context_hash);

CREATE TABLE IF NOT EXISTS policy_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  policy_key TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  result_hash TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_controls (
  control_key TEXT PRIMARY KEY,
  framework TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS control_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_key TEXT NOT NULL,
  policy_key TEXT NOT NULL,
  framework TEXT NOT NULL,
  UNIQUE(control_key, policy_key)
);

CREATE TABLE IF NOT EXISTS control_evidence_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(control_key, tenant_id, evidence_hash)
);

CREATE INDEX IF NOT EXISTS idx_control_evidence_control
  ON control_evidence_links (control_key, tenant_id, created_at DESC);
