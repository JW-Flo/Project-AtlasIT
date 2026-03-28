-- Prevent duplicate evidence rows caused by cron re-runs inserting fresh UUIDs.
DELETE FROM compliance_evidence
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM compliance_evidence
  GROUP BY tenant_id, COALESCE(source_id, id), control_id, COALESCE(framework, framework_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_dedup
  ON compliance_evidence(tenant_id, source_id, control_id, framework);
