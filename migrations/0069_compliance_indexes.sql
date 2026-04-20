-- Composite indexes for compliance evidence and scores queries (F-05)
-- Addresses N+1 query patterns and p95 latency spikes under load

-- Evidence lookups: by tenant + framework + control
-- Typical query: SELECT * FROM compliance_evidence WHERE tenant_id = $1 AND framework = $2 AND control_id = $3 ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_evidence_tenant_framework_control
  ON compliance_evidence (tenant_id, framework, control_id, created_at DESC);

-- Evidence dashboard widget: recent evidence by tenant
-- Typical query: SELECT * FROM compliance_evidence WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_evidence_tenant_created
  ON compliance_evidence (tenant_id, created_at DESC);

-- Compliance scores: by tenant + framework
-- Typical query: SELECT * FROM compliance_scores WHERE tenant_id = $1 AND framework = $2 ORDER BY evaluated_at DESC LIMIT 1
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_scores_tenant_framework
  ON compliance_scores (tenant_id, framework, evaluated_at DESC);

-- Compliance scores dashboard: all frameworks for tenant
-- Typical query: SELECT DISTINCT ON (framework) * FROM compliance_scores WHERE tenant_id = $1 ORDER BY framework, evaluated_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compliance_scores_tenant_evaluated
  ON compliance_scores (tenant_id, evaluated_at DESC);

-- Auto-update updated_at timestamp on compliance_evidence changes
CREATE OR REPLACE FUNCTION update_compliance_evidence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_evidence_updated_at
  BEFORE UPDATE ON compliance_evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_evidence_timestamp();

-- Auto-update updated_at timestamp on compliance_scores changes
CREATE OR REPLACE FUNCTION update_compliance_scores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_scores_updated_at
  BEFORE UPDATE ON compliance_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_scores_timestamp();

-- Run ANALYZE after index creation to update query planner statistics
ANALYZE compliance_evidence;
ANALYZE compliance_scores;
