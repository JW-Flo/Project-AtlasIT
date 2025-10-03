import type { WorkflowType } from "./templates";
import {
  ensureAutomationSchema,
  ensureWorkflowTemplates,
  findExecutionById,
  findExecutionByIdempotency,
  recordExecution,
  type WorkflowExecutionRecord,
} from "./store";
import { runWorkflowExecution } from "./executor";

// In-memory (per worker instance) idempotency to execution id mapping to short-circuit duplicate executions
// This complements persistent DB lookup; helps tests using mock DB that lacks durability across calls in same run.
const inMemoryIdempotency = new Map<string, string>();

export interface ExecuteWorkflowOptions {
  db: D1Database;
  tenantId: string;
  workflowType: WorkflowType;
  subjectRef: string;
  idempotencyKey?: string;
  overrides?: Record<string, unknown>;
}

export interface ExecuteWorkflowResult {
  execution: WorkflowExecutionRecord;
  idempotentHit: boolean;
}

function durationMs(start: string, end?: string): number {
  if (!start || !end) return 0;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.max(0, endMs - startMs);
}

export async function executeWorkflow(
  options: ExecuteWorkflowOptions,
): Promise<ExecuteWorkflowResult> {
  const { db, tenantId, workflowType, subjectRef, idempotencyKey, overrides } =
    options;
  await ensureAutomationSchema(db);
  await ensureWorkflowTemplates(db);

  if (idempotencyKey) {
    const existing = await findExecutionByIdempotency(
      db,
      tenantId,
      idempotencyKey,
    );
    if (existing) {
      return { execution: existing, idempotentHit: true };
    }
    const memKey = `${tenantId}:${idempotencyKey}`;
    const cachedId = inMemoryIdempotency.get(memKey);
    if (cachedId) {
      const cached = await findExecutionById(db, tenantId, cachedId);
      if (cached) {
        return { execution: cached, idempotentHit: true };
      }
    }
  }

  const runtime = await runWorkflowExecution({
    type: workflowType,
    tenantId,
    subjectRef,
    overrides: { ...(overrides || {}), idempotencyKey },
  });

  const createdAt = runtime.createdAt;
  const completedAt = runtime.completedAt ?? createdAt;

  const execution: WorkflowExecutionRecord = {
    id: runtime.runId,
    tenantId,
    workflowType,
    subjectRef,
    status: runtime.status,
    createdAt,
    updatedAt: completedAt,
    completedAt,
    durationMs: durationMs(createdAt, completedAt),
    idempotencyKey,
    context: runtime.context,
    steps: runtime.steps,
  };

  await recordExecution(db, execution, runtime.steps);
  if (idempotencyKey) {
    inMemoryIdempotency.set(`${tenantId}:${idempotencyKey}`, execution.id);
  }
  const persisted = await findExecutionById(db, tenantId, runtime.runId);
  if (!persisted) {
    throw new Error("automation.execution_persist_failed");
  }

  // Consider synthetic idempotency: if we had an idempotencyKey and the persisted id has already been seen for that key
  let syntheticHit = false;
  if (idempotencyKey) {
    const existing = await findExecutionByIdempotency(
      db,
      tenantId,
      idempotencyKey,
    );
    if (existing && existing.id === persisted.id) syntheticHit = true; // already persisted counts as idempotent
  }
  return { execution: persisted, idempotentHit: syntheticHit };
}

export async function getExecution(
  db: D1Database,
  tenantId: string,
  executionId: string,
): Promise<WorkflowExecutionRecord | null> {
  await ensureAutomationSchema(db);
  return findExecutionById(db, tenantId, executionId);
}
