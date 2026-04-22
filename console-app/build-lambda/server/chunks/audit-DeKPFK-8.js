import { l as lookupAuditEvidence } from './gap-analyzer-CVZTZ0l9.js';
import { queryPg } from './pg-BHX2Ay11.js';

const FRAMEWORK_PREFIX_MAP = [
  ["ISO-27001", "ISO27001"],
  ["NIST-CSF", "NIST_CSF"],
  ["SOC2", "SOC2"],
  ["HIPAA", "HIPAA"],
  ["GDPR", "GDPR"]
];
function parseControlRef(ref) {
  for (const [prefix, framework] of FRAMEWORK_PREFIX_MAP) {
    if (ref.startsWith(prefix + "-")) {
      return { framework, controlId: ref.slice(prefix.length + 1) };
    }
  }
  return { framework: ref, controlId: ref };
}
async function writeAudit(db, entry) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const id = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO audit_log (id, tenant_id, actor_id, actor_type, action, resource_type, resource_id, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      entry.tenantId,
      entry.actorUserId,
      "user",
      entry.action,
      entry.targetType,
      entry.targetId ?? null,
      JSON.stringify({ actorEmail: entry.actorEmail, detail: entry.detail }),
      now
    ).run();
  } catch (e) {
    console.error("audit write failed:", e);
  }
  const mapping = lookupAuditEvidence(entry.action);
  if (!mapping) return;
  for (const controlRef of mapping.controlRefs) {
    const { framework, controlId } = parseControlRef(controlRef);
    try {
      await db.prepare(
        `INSERT OR IGNORE INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        entry.tenantId,
        framework,
        controlId,
        mapping.description,
        mapping.category,
        "platform",
        entry.targetId ?? null,
        entry.actorEmail,
        entry.detail ?? entry.targetType,
        JSON.stringify({
          impact: mapping.impact,
          eventType: entry.action,
          reasoning: mapping.description,
          confidence: 1,
          auditAction: entry.action
        }),
        now
      ).run();
    } catch {
    }
  }
}
async function writeAuditPg(entry) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const id = crypto.randomUUID();
    await queryPg(
      `INSERT INTO audit_log (id, tenant_id, actor_id, actor_type, action, resource_type, resource_id, details, created_at)
       VALUES ($1, $2, $3, 'user', $4, $5, $6, $7, $8)`,
      [
        id,
        entry.tenantId,
        entry.actorUserId,
        entry.action,
        entry.targetType,
        entry.targetId ?? null,
        JSON.stringify({ actorEmail: entry.actorEmail, detail: entry.detail }),
        now
      ]
    );
  } catch (e) {
    console.error("audit write failed:", e);
  }
  const mapping = lookupAuditEvidence(entry.action);
  if (!mapping) return;
  for (const controlRef of mapping.controlRefs) {
    const { framework, controlId } = parseControlRef(controlRef);
    try {
      await queryPg(
        `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'platform', $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [
          crypto.randomUUID(),
          entry.tenantId,
          framework,
          controlId,
          mapping.description,
          mapping.category,
          entry.targetId ?? null,
          entry.actorEmail,
          entry.detail ?? entry.targetType,
          JSON.stringify({
            impact: mapping.impact,
            eventType: entry.action,
            reasoning: mapping.description,
            confidence: 1,
            auditAction: entry.action
          }),
          now
        ]
      );
    } catch {
    }
  }
}

export { writeAuditPg as a, writeAudit as w };
//# sourceMappingURL=audit-DeKPFK-8.js.map
