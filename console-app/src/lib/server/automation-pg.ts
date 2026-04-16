/**
 * PostgreSQL-backed automation rules store
 * Replaces D1 automation.ts for AWS Lambda environment
 */

import type {
  AutomationRule,
  AutomationExecution,
  AppHealthCheck,
  CreateRuleInput,
  UpdateRuleInput,
} from "@atlasit/shared";
import { queryPg, queryPgOne } from "./pg.js";

function rowToRule(row: any): AutomationRule {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description ?? undefined,
    enabled: !!row.enabled,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config || {},
    conditions: row.conditions || [],
    actions: row.actions || [],
    lastRunAt: row.last_run_at ?? undefined,
    lastStatus: row.last_status ?? undefined,
    runCount: row.run_count ?? 0,
    errorCount: row.error_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
  };
}

function rowToExecution(row: any): AutomationExecution {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    ruleId: row.rule_id,
    triggerEvent: row.trigger_event || {},
    status: row.status,
    actionsRun: row.actions_run ?? 0,
    actionsFailed: row.actions_failed ?? 0,
    results: row.results ?? undefined,
    durationMs: row.duration_ms ?? undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function rowToHealthCheck(row: any): AppHealthCheck {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    appId: row.app_id,
    healthy: !!row.healthy,
    responseMs: row.response_ms ?? undefined,
    errorMsg: row.error_msg ?? undefined,
    details: row.details ? JSON.parse(row.details) : undefined,
    checkedAt: row.checked_at,
  };
}

export async function listRules(tenantId: string): Promise<AutomationRule[]> {
  const rows = await queryPg<any>(
    "SELECT * FROM automation_rules WHERE tenant_id = $1 ORDER BY created_at DESC",
    [tenantId],
  );
  return rows.map(rowToRule);
}

export async function getRule(ruleId: string, tenantId: string): Promise<AutomationRule | null> {
  const row = await queryPgOne<any>(
    "SELECT * FROM automation_rules WHERE id = $1 AND tenant_id = $2",
    [ruleId, tenantId],
  );
  return row ? rowToRule(row) : null;
}

export async function createRule(
  tenantId: string,
  userId: string,
  input: CreateRuleInput,
): Promise<AutomationRule> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const row = await queryPgOne<any>(
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
      now,
    ],
  );

  return rowToRule(row!);
}

export async function updateRule(
  ruleId: string,
  tenantId: string,
  input: UpdateRuleInput,
): Promise<AutomationRule | null> {
  const sets: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.enabled !== undefined) {
    sets.push(`enabled = $${paramIndex++}`);
    values.push(input.enabled);
  }
  if (input.triggerType !== undefined) {
    sets.push(`trigger_type = $${paramIndex++}`);
    values.push(input.triggerType);
  }
  if (input.triggerConfig !== undefined) {
    sets.push(`trigger_config = $${paramIndex++}`);
    values.push(JSON.stringify(input.triggerConfig));
  }
  if (input.conditions !== undefined) {
    sets.push(`conditions = $${paramIndex++}`);
    values.push(JSON.stringify(input.conditions));
  }
  if (input.actions !== undefined) {
    sets.push(`actions = $${paramIndex++}`);
    values.push(JSON.stringify(input.actions));
  }

  if (sets.length === 0) {
    return await getRule(ruleId, tenantId);
  }

  sets.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());

  values.push(ruleId, tenantId);

  const row = await queryPgOne<any>(
    `UPDATE automation_rules SET ${sets.join(", ")}
     WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
     RETURNING *`,
    values,
  );

  return row ? rowToRule(row) : null;
}

export async function deleteRule(ruleId: string, tenantId: string): Promise<boolean> {
  const rows = await queryPg(
    "DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2 RETURNING id",
    [ruleId, tenantId],
  );
  return rows.length > 0;
}

export async function listExecutions(
  tenantId: string,
  ruleId?: string,
): Promise<AutomationExecution[]> {
  const sql = ruleId
    ? "SELECT * FROM automation_executions WHERE tenant_id = $1 AND rule_id = $2 ORDER BY started_at DESC LIMIT 100"
    : "SELECT * FROM automation_executions WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT 100";
  const params = ruleId ? [tenantId, ruleId] : [tenantId];

  const rows = await queryPg<any>(sql, params);
  return rows.map(rowToExecution);
}

export async function recordExecution(
  tenantId: string,
  ruleId: string,
  execution: Omit<AutomationExecution, "id" | "tenantId" | "ruleId">,
): Promise<string> {
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
      execution.completedAt ?? null,
    ],
  );

  // Update rule stats
  const statusUpdate = execution.status === "failed" ? ", error_count = error_count + 1" : "";

  await queryPg(
    `UPDATE automation_rules
     SET last_run_at = $1, last_status = $2, run_count = run_count + 1${statusUpdate}, updated_at = NOW()
     WHERE id = $3 AND tenant_id = $4`,
    [execution.startedAt, execution.status, ruleId, tenantId],
  );

  return id;
}

export async function dismissSuggestion(
  tenantId: string,
  templateId: string,
  dismissedBy?: string,
): Promise<void> {
  await queryPg(
    `INSERT INTO dismissed_suggestions (id, tenant_id, template_id, dismissed_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [crypto.randomUUID(), tenantId, templateId, dismissedBy ?? null],
  );
}

export async function listDismissedSuggestions(tenantId: string): Promise<string[]> {
  const rows = await queryPg<any>(
    "SELECT template_id FROM dismissed_suggestions WHERE tenant_id = $1",
    [tenantId],
  );

  return rows.map((r: any) => r.template_id as string);
}

export async function recordHealthCheck(
  tenantId: string,
  check: Omit<AppHealthCheck, "id" | "tenantId" | "checkedAt">,
): Promise<string> {
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
      check.details ? JSON.stringify(check.details) : null,
    ],
  );

  return id;
}

export async function getLatestHealthChecks(tenantId: string): Promise<AppHealthCheck[]> {
  const rows = await queryPg<any>(
    `SELECT h1.* FROM app_health_checks h1
     INNER JOIN (
       SELECT app_id, MAX(checked_at) as latest
       FROM app_health_checks WHERE tenant_id = $1
       GROUP BY app_id
     ) h2 ON h1.app_id = h2.app_id AND h1.checked_at = h2.latest
     WHERE h1.tenant_id = $2
     ORDER BY h1.checked_at DESC`,
    [tenantId, tenantId],
  );

  return rows.map(rowToHealthCheck);
}

export async function getHealthHistory(
  tenantId: string,
  appId: string,
  limit = 24,
): Promise<AppHealthCheck[]> {
  const rows = await queryPg<any>(
    "SELECT * FROM app_health_checks WHERE tenant_id = $1 AND app_id = $2 ORDER BY checked_at DESC LIMIT $3",
    [tenantId, appId, limit],
  );

  return rows.map(rowToHealthCheck);
}
