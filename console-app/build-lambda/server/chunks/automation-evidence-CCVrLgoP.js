import { A as ACTION_COMPLIANCE_MAP } from './gap-analyzer-CVZTZ0l9.js';

async function emitRuleComplianceEvidence(db, tenantId, ruleId, ruleName, actions, actorEmail) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await db.prepare(
    `SELECT framework, control_id FROM compliance_evidence
       WHERE tenant_id = ? AND source = 'automation_rule' AND source_id = ?`
  ).bind(tenantId, ruleId).all().catch(() => ({ results: [] }));
  const existingKeys = new Set(
    (existing.results ?? []).map((r) => `${r.framework}:${r.control_id}`)
  );
  for (const action of actions) {
    const controls = ACTION_COMPLIANCE_MAP[action.type];
    if (!controls?.length) continue;
    for (const ctrl of controls) {
      const key = `${ctrl.framework}:${ctrl.controlId}`;
      if (existingKeys.has(key)) continue;
      try {
        await db.prepare(
          `INSERT OR IGNORE INTO compliance_evidence
             (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          tenantId,
          ctrl.framework,
          ctrl.controlId,
          ctrl.controlName,
          ctrl.evidenceType,
          "automation_rule",
          ruleId,
          actorEmail,
          `Rule: ${ruleName}`,
          JSON.stringify({
            ruleId,
            ruleName,
            actionType: action.type,
            evidenceReason: `Automation rule configured with ${action.type} action`,
            confidence: 0.8
          }),
          now
        ).run();
        existingKeys.add(key);
      } catch {
      }
    }
  }
}

export { emitRuleComplianceEvidence as e };
//# sourceMappingURL=automation-evidence-CCVrLgoP.js.map
