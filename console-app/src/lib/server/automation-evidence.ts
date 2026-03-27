import { ACTION_COMPLIANCE_MAP } from "@atlasit/shared";

/**
 * When an automation rule is created or enabled, emit compliance evidence
 * for each action type in the rule that maps to compliance controls.
 *
 * This ensures that enabling a rule with e.g. "provision_app_access" actions
 * immediately creates evidence for CC6.1, A.9.2.2, PR.AC-1, etc.,
 * so compliance scores reflect the automation posture.
 */
export async function emitRuleComplianceEvidence(
  db: any,
  tenantId: string,
  ruleId: string,
  ruleName: string,
  actions: Array<{ type: string; [key: string]: unknown }>,
  actorEmail: string,
): Promise<void> {
  const now = new Date().toISOString();

  // Check which controls already have evidence for this rule to avoid duplicates
  // (e.g. toggling a rule off/on shouldn't inflate scores)
  const existing = await db
    .prepare(
      `SELECT framework, control_id FROM compliance_evidence
       WHERE tenant_id = ? AND source = 'automation_rule' AND source_id = ?`,
    )
    .bind(tenantId, ruleId)
    .all()
    .catch(() => ({ results: [] }));

  const existingKeys = new Set(
    (existing.results ?? []).map((r: any) => `${r.framework}:${r.control_id}`),
  );

  for (const action of actions) {
    const controls = ACTION_COMPLIANCE_MAP[action.type];
    if (!controls?.length) continue;

    for (const ctrl of controls) {
      const key = `${ctrl.framework}:${ctrl.controlId}`;
      if (existingKeys.has(key)) continue;

      try {
        await db
          .prepare(
            `INSERT INTO compliance_evidence
             (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
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
              confidence: 0.8,
            }),
            now,
          )
          .run();
        existingKeys.add(key);
      } catch {
        // Non-fatal
      }
    }
  }
}
