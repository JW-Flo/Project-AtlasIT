/**
 * Server-side automation rules store backed by D1.
 * Handles CRUD for automation rules and execution history.
 */

import type {
  AutomationRule,
  AutomationExecution,
  AppHealthCheck,
  CreateRuleInput,
  UpdateRuleInput,
} from "@atlasit/shared/automation/types";

// ---------------------------------------------------------------------------
// Row ↔ Domain mappers
// ---------------------------------------------------------------------------

function rowToRule(row: any): AutomationRule {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description ?? undefined,
    enabled: !!row.enabled,
    triggerType: row.trigger_type,
    triggerConfig: JSON.parse(row.trigger_config || "{}"),
    conditions: JSON.parse(row.conditions || "[]"),
    actions: JSON.parse(row.actions || "[]"),
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
    triggerEvent: JSON.parse(row.trigger_event || "{}"),
    status: row.status,
    actionsRun: row.actions_run ?? 0,
    actionsFailed: row.actions_failed ?? 0,
    results: row.results ? JSON.parse(row.results) : undefined,
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

// ---------------------------------------------------------------------------
// Automation Rules CRUD
// ---------------------------------------------------------------------------

export async function listRules(
  db: D1Database,
  tenantId: string,
): Promise<AutomationRule[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM automation_rules WHERE tenant_id = ? ORDER BY created_at DESC",
    )
    .bind(tenantId)
    .all();

  return (results || []).map(rowToRule);
}

export async function getRule(
  db: D1Database,
  tenantId: string,
  ruleId: string,
): Promise<AutomationRule | null> {
  const row = await db
    .prepare("SELECT * FROM automation_rules WHERE id = ? AND tenant_id = ?")
    .bind(ruleId, tenantId)
    .first();

  return row ? rowToRule(row) : null;
}

export async function createRule(
  db: D1Database,
  tenantId: string,
  input: CreateRuleInput,
  createdBy?: string,
): Promise<AutomationRule> {
  const id = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO automation_rules
        (id, tenant_id, name, description, trigger_type, trigger_config, conditions, actions, created_at, updated_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      tenantId,
      input.name,
      input.description ?? null,
      input.triggerType,
      JSON.stringify(input.triggerConfig),
      JSON.stringify(input.conditions ?? []),
      JSON.stringify(input.actions),
      now,
      now,
      createdBy ?? null,
    )
    .run();

  return (await getRule(db, tenantId, id))!;
}

export async function updateRule(
  db: D1Database,
  tenantId: string,
  ruleId: string,
  input: UpdateRuleInput,
): Promise<AutomationRule | null> {
  const existing = await getRule(db, tenantId, ruleId);
  if (!existing) return null;

  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    sets.push("name = ?");
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push("description = ?");
    values.push(input.description);
  }
  if (input.enabled !== undefined) {
    sets.push("enabled = ?");
    values.push(input.enabled ? 1 : 0);
  }
  if (input.triggerConfig !== undefined) {
    sets.push("trigger_config = ?");
    values.push(JSON.stringify(input.triggerConfig));
  }
  if (input.conditions !== undefined) {
    sets.push("conditions = ?");
    values.push(JSON.stringify(input.conditions));
  }
  if (input.actions !== undefined) {
    sets.push("actions = ?");
    values.push(JSON.stringify(input.actions));
  }

  if (sets.length === 0) return existing;

  sets.push("updated_at = datetime('now')");
  values.push(ruleId, tenantId);

  await db
    .prepare(
      `UPDATE automation_rules SET ${sets.join(", ")} WHERE id = ? AND tenant_id = ?`,
    )
    .bind(...values)
    .run();

  return getRule(db, tenantId, ruleId);
}

export async function deleteRule(
  db: D1Database,
  tenantId: string,
  ruleId: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM automation_rules WHERE id = ? AND tenant_id = ?")
    .bind(ruleId, tenantId)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function toggleRule(
  db: D1Database,
  tenantId: string,
  ruleId: string,
  enabled: boolean,
): Promise<AutomationRule | null> {
  return updateRule(db, tenantId, ruleId, { enabled });
}

// ---------------------------------------------------------------------------
// Execution History
// ---------------------------------------------------------------------------

export async function listExecutions(
  db: D1Database,
  tenantId: string,
  opts?: { ruleId?: string; limit?: number },
): Promise<AutomationExecution[]> {
  const limit = opts?.limit ?? 50;

  if (opts?.ruleId) {
    const { results } = await db
      .prepare(
        "SELECT * FROM automation_executions WHERE tenant_id = ? AND rule_id = ? ORDER BY started_at DESC LIMIT ?",
      )
      .bind(tenantId, opts.ruleId, limit)
      .all();
    return (results || []).map(rowToExecution);
  }

  const { results } = await db
    .prepare(
      "SELECT * FROM automation_executions WHERE tenant_id = ? ORDER BY started_at DESC LIMIT ?",
    )
    .bind(tenantId, limit)
    .all();

  return (results || []).map(rowToExecution);
}

export async function recordExecution(
  db: D1Database,
  tenantId: string,
  ruleId: string,
  execution: Omit<AutomationExecution, "id" | "tenantId" | "ruleId">,
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, "");

  await db
    .prepare(
      `INSERT INTO automation_executions
        (id, tenant_id, rule_id, trigger_event, status, actions_run, actions_failed, results, duration_ms, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
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
    )
    .run();

  // Update rule stats
  const statusUpdate =
    execution.status === "failed" ? ", error_count = error_count + 1" : "";

  await db
    .prepare(
      `UPDATE automation_rules
       SET last_run_at = ?, last_status = ?, run_count = run_count + 1${statusUpdate}, updated_at = datetime('now')
       WHERE id = ? AND tenant_id = ?`,
    )
    .bind(execution.startedAt, execution.status, ruleId, tenantId)
    .run();

  return id;
}

// ---------------------------------------------------------------------------
// Dismissed Suggestions
// ---------------------------------------------------------------------------

export async function dismissSuggestion(
  db: D1Database,
  tenantId: string,
  templateId: string,
  dismissedBy?: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO dismissed_suggestions (id, tenant_id, template_id, dismissed_by)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID().replace(/-/g, ""),
      tenantId,
      templateId,
      dismissedBy ?? null,
    )
    .run();
}

export async function listDismissedSuggestions(
  db: D1Database,
  tenantId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      "SELECT template_id FROM dismissed_suggestions WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .all();

  return (results || []).map((r: any) => r.template_id as string);
}

// ---------------------------------------------------------------------------
// Health Checks
// ---------------------------------------------------------------------------

export async function recordHealthCheck(
  db: D1Database,
  tenantId: string,
  check: Omit<AppHealthCheck, "id" | "tenantId" | "checkedAt">,
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, "");

  await db
    .prepare(
      `INSERT INTO app_health_checks (id, tenant_id, app_id, healthy, response_ms, error_msg, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      tenantId,
      check.appId,
      check.healthy ? 1 : 0,
      check.responseMs ?? null,
      check.errorMsg ?? null,
      check.details ? JSON.stringify(check.details) : null,
    )
    .run();

  return id;
}

export async function getLatestHealthChecks(
  db: D1Database,
  tenantId: string,
): Promise<AppHealthCheck[]> {
  const { results } = await db
    .prepare(
      `SELECT h1.* FROM app_health_checks h1
       INNER JOIN (
         SELECT app_id, MAX(checked_at) as latest
         FROM app_health_checks WHERE tenant_id = ?
         GROUP BY app_id
       ) h2 ON h1.app_id = h2.app_id AND h1.checked_at = h2.latest
       WHERE h1.tenant_id = ?
       ORDER BY h1.checked_at DESC`,
    )
    .bind(tenantId, tenantId)
    .all();

  return (results || []).map(rowToHealthCheck);
}

export async function getHealthHistory(
  db: D1Database,
  tenantId: string,
  appId: string,
  limit = 24,
): Promise<AppHealthCheck[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM app_health_checks WHERE tenant_id = ? AND app_id = ? ORDER BY checked_at DESC LIMIT ?",
    )
    .bind(tenantId, appId, limit)
    .all();

  return (results || []).map(rowToHealthCheck);
}
