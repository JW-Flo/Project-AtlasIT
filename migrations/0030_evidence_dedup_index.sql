-- Prevent duplicate evidence rows caused by cron re-runs inserting fresh UUIDs.
-- The existing INSERT OR IGNORE statements only check the random UUID primary key,
-- which never conflicts. This index makes (tenant, source, control, framework) the
-- real uniqueness boundary so INSERT OR IGNORE / ON CONFLICT DO NOTHING works.

-- First, deduplicate existing rows: keep the most recent per unique key.
DELETE FROM compliance_evidence
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM compliance_evidence
  GROUP BY tenant_id, COALESCE(source_id, id), control_id, COALESCE(framework, framework_id)
);

-- Now create the unique index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_dedup
  ON compliance_evidence(tenant_id, source_id, control_id, framework);
