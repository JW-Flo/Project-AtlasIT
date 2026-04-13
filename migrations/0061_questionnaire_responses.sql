-- Migration 0061 — Questionnaire AI persistence
--
-- Stores parsed questionnaire questions, AI-generated draft responses, and
-- tenant feedback (accepted / edited / rejected) so the AI can learn from
-- prior responses for consistency on future questionnaires.

CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,                     -- "Acme Vendor Security 2026 Q2"
  source_format TEXT,                     -- "sig" | "caiq" | "custom" | "csv"
  question_count INTEGER NOT NULL DEFAULT 0,
  created_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questionnaires_tenant ON questionnaires(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  questionnaire_id UUID,                  -- FK to questionnaires (nullable for one-shot generation)
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  section TEXT,
  mapped_controls TEXT,                   -- comma-separated control IDs
  confidence NUMERIC(3,2),                -- 0.00-1.00
  response_text TEXT,                     -- AI-generated draft
  evidence_refs TEXT,                     -- comma-separated control IDs that contributed
  feedback TEXT CHECK (feedback IN ('accepted','edited','rejected') OR feedback IS NULL),
  feedback_at TIMESTAMPTZ,
  edited_text TEXT,                       -- if feedback=edited, the user's final answer
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_tenant_feedback ON questionnaire_responses(tenant_id, feedback, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_questionnaire ON questionnaire_responses(questionnaire_id);
