-- Trust Center: NDA access requests and questionnaire tables

CREATE TABLE IF NOT EXISTS trust_access_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_company TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | denied
  access_token TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_trust_access_tenant ON trust_access_requests(tenant_id, status);

CREATE TABLE IF NOT EXISTS questionnaires (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'custom',  -- sig_lite | caiq | custom
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | generating | ready | archived
  questions_count INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id TEXT PRIMARY KEY,
  questionnaire_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  section TEXT,
  mapped_controls TEXT,  -- JSON array of control IDs
  generated_response TEXT,
  edited_response TEXT,
  evidence_refs TEXT,  -- JSON array of evidence IDs
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | generated | reviewed | approved
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_responses ON questionnaire_responses(questionnaire_id, question_index);
