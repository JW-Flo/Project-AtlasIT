import { queryPg, queryPgOne } from './pg-BHX2Ay11.js';

function rowToRule(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description ?? void 0,
    enabled: !!row.enabled,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config || {},
    conditions: row.conditions || [],
    actions: row.actions || [],
    lastRunAt: row.last_run_at ?? void 0,
    lastStatus: row.last_status ?? void 0,
    runCount: row.run_count ?? 0,
    errorCount: row.error_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? void 0
  };
}
function rowToHealthCheck(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    appId: row.app_id,
    healthy: !!row.healthy,
    responseMs: row.response_ms ?? void 0,
    errorMsg: row.error_msg ?? void 0,
    details: row.details ? JSON.parse(row.details) : void 0,
    checkedAt: row.checked_at
  };
}
async function listRules(tenantId) {
  const rows = await queryPg(
    "SELECT * FROM automation_rules WHERE tenant_id = $1 ORDER BY created_at DESC",
    [tenantId]
  );
  return rows.map(rowToRule);
}
async function getRule(ruleId, tenantId) {
  const row = await queryPgOne(
    "SELECT * FROM automation_rules WHERE id = $1 AND tenant_id = $2",
    [ruleId, tenantId]
  );
  return row ? rowToRule(row) : null;
}
async function createRule(tenantId, userId, input) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const row = await queryPgOne(
    `INSERT INTO automation_rules
     (id, tenant_id, name, description, trigger_type, trigger_config, conditions, actions, enabled, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id,
      tenantId,
      input.name,
      input.description || null,
      input.triggerType,
      JSON.stringify(input.triggerConfig || {}),
      JSON.stringify(input.conditions || []),
      JSON.stringify(input.actions || []),
      input.enabled ?? true,
      userId,
      now,
      now
    ]
  );
  return rowToRule(row);
}
async function updateRule(ruleId, tenantId, input) {
  const sets = [];
  const values = [];
  let paramIndex = 1;
  if (input.name !== void 0) {
    sets.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== void 0) {
    sets.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.enabled !== void 0) {
    sets.push(`enabled = $${paramIndex++}`);
    values.push(input.enabled);
  }
  if (input.triggerType !== void 0) {
    sets.push(`trigger_type = $${paramIndex++}`);
    values.push(input.triggerType);
  }
  if (input.triggerConfig !== void 0) {
    sets.push(`trigger_config = $${paramIndex++}`);
    values.push(JSON.stringify(input.triggerConfig));
  }
  if (input.conditions !== void 0) {
    sets.push(`conditions = $${paramIndex++}`);
    values.push(JSON.stringify(input.conditions));
  }
  if (input.actions !== void 0) {
    sets.push(`actions = $${paramIndex++}`);
    values.push(JSON.stringify(input.actions));
  }
  if (sets.length === 0) {
    return await getRule(ruleId, tenantId);
  }
  sets.push(`updated_at = $${paramIndex++}`);
  values.push((/* @__PURE__ */ new Date()).toISOString());
  values.push(ruleId, tenantId);
  const row = await queryPgOne(
    `UPDATE automation_rules SET ${sets.join(", ")}
     WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
     RETURNING *`,
    values
  );
  return row ? rowToRule(row) : null;
}
async function deleteRule(ruleId, tenantId) {
  const rows = await queryPg(
    "DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [ruleId, tenantId]
  );
  return rows.length > 0;
}
async function recordExecution(tenantId, ruleId, execution) {
  const id = crypto.randomUUID();
  await queryPg(
    `INSERT INTO automation_executions
     (id, tenant_id, rule_id, trigger_event, status, actions_run, actions_failed, results, duration_ms, started_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      tenantId,
      ruleId,
      JSON.stringify(execution.triggerEvent),
      execution.status,
      execution.actionsRun,
      execution.actionsFailed,
      execution.results ? JSON.stringify(execution.results) : null,
      execution.durationMs ?? null,
      execution.startedAt,
      execution.completedAt ?? null
    ]
  );
  const statusUpdate = execution.status === "failed" ? ", error_count = error_count + 1" : "";
  await queryPg(
    `UPDATE automation_rules
     SET last_run_at = $1, last_status = $2, run_count = run_count + 1${statusUpdate}, updated_at = NOW()
     WHERE id = $3 AND tenant_id = $4`,
    [execution.startedAt, execution.status, ruleId, tenantId]
  );
  return id;
}
async function dismissSuggestion(tenantId, templateId, dismissedBy) {
  await queryPg(
    `INSERT INTO dismissed_suggestions (id, tenant_id, template_id, dismissed_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [crypto.randomUUID(), tenantId, templateId, dismissedBy ?? null]
  );
}
async function listDismissedSuggestions(tenantId) {
  const rows = await queryPg(
    "SELECT template_id FROM dismissed_suggestions WHERE tenant_id = $1",
    [tenantId]
  );
  return rows.map((r) => r.template_id);
}
async function recordHealthCheck(tenantId, check) {
  const id = crypto.randomUUID();
  await queryPg(
    `INSERT INTO app_health_checks (id, tenant_id, app_id, healthy, response_ms, error_msg, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      tenantId,
      check.appId,
      check.healthy ? true : false,
      check.responseMs ?? null,
      check.errorMsg ?? null,
      check.details ? JSON.stringify(check.details) : null
    ]
  );
  return id;
}
async function getLatestHealthChecks(tenantId) {
  const rows = await queryPg(
    `SELECT h1.* FROM app_health_checks h1
     INNER JOIN (
       SELECT app_id, MAX(checked_at) as latest
       FROM app_health_checks WHERE tenant_id = $1
       GROUP BY app_id
     ) h2 ON h1.app_id = h2.app_id AND h1.checked_at = h2.latest
     WHERE h1.tenant_id = $2
     ORDER BY h1.checked_at DESC`,
    [tenantId, tenantId]
  );
  return rows.map(rowToHealthCheck);
}
async function getHealthHistory(tenantId, appId, limit = 24) {
  const rows = await queryPg(
    "SELECT * FROM app_health_checks WHERE tenant_id = $1 AND app_id = $2 ORDER BY checked_at DESC LIMIT $3",
    [tenantId, appId, limit]
  );
  return rows.map(rowToHealthCheck);
}

export { getLatestHealthChecks as a, recordHealthCheck as b, createRule as c, deleteRule as d, getRule as e, listDismissedSuggestions as f, getHealthHistory as g, dismissSuggestion as h, listRules as l, recordExecution as r, updateRule as u };
//# sourceMappingURL=automation-pg-BL11rGe-.js.map
