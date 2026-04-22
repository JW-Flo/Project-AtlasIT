import { json } from '@sveltejs/kit';

const GET = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const { queryPgOne } = await import('./pg-BHX2Ay11.js');
  const row = await queryPgOne(
    `SELECT e.*, r.name as rule_name, r.trigger_type
     FROM automation_executions e
     LEFT JOIN automation_rules r ON r.id = e.rule_id
     WHERE e.id = $1 AND e.tenant_id = $2`,
    [params.id, tenantId]
  );
  if (!row) {
    return json({ error: "Execution not found" }, { status: 404 });
  }
  return json({
    execution: {
      id: row.id,
      tenantId: row.tenant_id,
      ruleId: row.rule_id,
      ruleName: row.rule_name ?? "Unknown rule",
      triggerType: row.trigger_type ?? void 0,
      triggerEvent: JSON.parse(row.trigger_event || "{}"),
      status: row.status,
      actionsRun: row.actions_run ?? 0,
      actionsFailed: row.actions_failed ?? 0,
      results: row.results ? JSON.parse(row.results) : [],
      durationMs: row.duration_ms ?? void 0,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? void 0
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-CRfadCJM.js.map
