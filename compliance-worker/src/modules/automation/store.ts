import { WorkflowType, listTemplates } from "./templates";

export interface WorkflowStepRecord {
  stepId: string;
  action: string;
  status: string;
  attempts: number;
  output?: unknown;
  error?: string | null;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}

export interface WorkflowExecutionRecord {
  id: string;
  tenantId: string;
  workflowType: WorkflowType;
  subjectRef: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  durationMs: number;
  idempotencyKey?: string | null;
  context: Record<string, unknown>;
  steps: WorkflowStepRecord[];
}

function serialize(obj: unknown): string {
  return JSON.stringify(obj ?? null);
}

function parseJson<T>(value: unknown): T {
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${(err as Error).message}`);
  }
}

export async function ensureAutomationSchema(db: D1Database) {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS workflow_templates (
       type TEXT PRIMARY KEY,
       payload TEXT NOT NULL,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL
     );
     CREATE TABLE IF NOT EXISTS workflow_executions (
       id TEXT PRIMARY KEY,
       tenant_id TEXT NOT NULL,
       workflow_type TEXT NOT NULL,
       subject_ref TEXT,
       status TEXT NOT NULL,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL,
       completed_at TEXT,
       duration_ms INTEGER DEFAULT 0,
       idempotency_key TEXT,
       context_json TEXT NOT NULL
     );
     CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_exec_tenant_created
       ON workflow_executions (tenant_id, created_at DESC);
     CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_exec_idempotent
       ON workflow_executions (tenant_id, idempotency_key)
       WHERE idempotency_key IS NOT NULL;
     CREATE TABLE IF NOT EXISTS workflow_steps (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       execution_id TEXT NOT NULL,
       step_id TEXT NOT NULL,
       action TEXT NOT NULL,
       status TEXT NOT NULL,
       attempts INTEGER DEFAULT 0,
       output_json TEXT,
       error TEXT,
       started_at TEXT,
       completed_at TEXT,
       duration_ms INTEGER DEFAULT 0,
       FOREIGN KEY(execution_id) REFERENCES workflow_executions(id)
     );
     CREATE INDEX IF NOT EXISTS idx_workflow_steps_execution
       ON workflow_steps (execution_id, id ASC);
    `,
  );
}

export async function ensureWorkflowTemplates(db: D1Database) {
  const now = new Date().toISOString();
  for (const template of listTemplates()) {
    await db
      .prepare(
        `INSERT INTO workflow_templates (type, payload, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(type) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .bind(template.type, serialize(template), now, now)
      .run();
  }
}

export async function recordExecution(
  db: D1Database,
  execution: Omit<WorkflowExecutionRecord, "steps">,
  steps: WorkflowStepRecord[],
) {
  await db
    .prepare(
      `INSERT INTO workflow_executions (
         id, tenant_id, workflow_type, subject_ref, status,
         created_at, updated_at, completed_at, duration_ms,
         idempotency_key, context_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         updated_at = excluded.updated_at,
         completed_at = excluded.completed_at,
         duration_ms = excluded.duration_ms,
         context_json = excluded.context_json,
         subject_ref = excluded.subject_ref,
         idempotency_key = excluded.idempotency_key;
      `,
    )
    .bind(
      execution.id,
      execution.tenantId,
      execution.workflowType,
      execution.subjectRef,
      execution.status,
      execution.createdAt,
      execution.updatedAt,
      execution.completedAt ?? null,
      execution.durationMs,
      execution.idempotencyKey ?? null,
      serialize(execution.context),
    )
    .run();

  await db
    .prepare(`DELETE FROM workflow_steps WHERE execution_id = ?`)
    .bind(execution.id)
    .run();

  for (const step of steps) {
    await db
      .prepare(
        `INSERT INTO workflow_steps (
           execution_id, step_id, action, status, attempts,
           output_json, error, started_at, completed_at, duration_ms
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        execution.id,
        step.stepId,
        step.action,
        step.status,
        step.attempts,
        serialize(step.output ?? null),
        step.error ?? null,
        step.startedAt,
        step.completedAt ?? null,
        step.durationMs,
      )
      .run();
  }
}

export async function findExecutionById(
  db: D1Database,
  tenantId: string,
  id: string,
): Promise<WorkflowExecutionRecord | null> {
  const executionRow = await db
    .prepare(
      `SELECT id, tenant_id, workflow_type, subject_ref, status,
              created_at, updated_at, completed_at, duration_ms,
              idempotency_key, context_json
       FROM workflow_executions
       WHERE id = ? AND tenant_id = ?
       LIMIT 1`,
    )
    .bind(id, tenantId)
    .first<{
      id: string;
      tenant_id: string;
      workflow_type: WorkflowType;
      subject_ref: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      completed_at: string | null;
      duration_ms: number | null;
      idempotency_key: string | null;
      context_json: string;
    }>();

  if (!executionRow) return null;

  // Fetch step rows (element type generic, not wrapper) so each result row is strongly typed
  const stepsResult = await db
    .prepare(
      `SELECT step_id, action, status, attempts, output_json,
              error, started_at, completed_at, duration_ms
       FROM workflow_steps
       WHERE execution_id = ?
       ORDER BY id ASC`,
    )
    .bind(id)
    .all<{
      step_id: string;
      action: string;
      status: string;
      attempts: number | null;
      output_json: string | null;
      error: string | null;
      started_at: string | null;
      completed_at: string | null;
      duration_ms: number | null;
    }>();

  const steps = (stepsResult.results ?? []).map((row) => ({
    stepId: row.step_id,
    action: row.action,
    status: row.status,
    attempts: row.attempts ?? 0,
    output: row.output_json ? parseJson(row.output_json) : undefined,
    error: row.error,
    startedAt: row.started_at ?? executionRow.created_at,
    completedAt: row.completed_at ?? undefined,
    durationMs: row.duration_ms ?? 0,
  }));

  return {
    id: executionRow.id,
    tenantId: executionRow.tenant_id,
    workflowType: executionRow.workflow_type,
    subjectRef: executionRow.subject_ref,
    status: executionRow.status,
    createdAt: executionRow.created_at,
    updatedAt: executionRow.updated_at,
    completedAt: executionRow.completed_at,
    durationMs: executionRow.duration_ms ?? 0,
    idempotencyKey: executionRow.idempotency_key,
    context: parseJson<Record<string, unknown>>(executionRow.context_json),
    steps,
  };
}

export async function findExecutionByIdempotency(
  db: D1Database,
  tenantId: string,
  idempotencyKey: string,
): Promise<WorkflowExecutionRecord | null> {
  const row = await db
    .prepare(
      `SELECT id FROM workflow_executions
       WHERE tenant_id = ? AND idempotency_key = ?
       LIMIT 1`,
    )
    .bind(tenantId, idempotencyKey)
    .first<{ id: string }>();

  if (!row) return null;
  return findExecutionById(db, tenantId, row.id);
}

export async function latestExecutionsCount(
  db: D1Database,
  tenantId: string,
  sinceIso: string,
) {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM workflow_executions
       WHERE tenant_id = ? AND created_at >= ?`,
    )
    .bind(tenantId, sinceIso)
    .first<{ count: number }>();
  return result?.count ?? 0;
}
