/**
 * dlq-processor Lambda processor
 *
 * Processes dead-letter queue (DLQ) messages from the SQS step_tasks_dlq queue.
 * Ported from ai-orchestrator/src/routes/dead-letter.ts and lib/dead-letter.ts.
 *
 * The DLQ processor is triggered by SQS when messages exceed the max receive count
 * on the main step_tasks queue. It records failures, alerts, and attempts safe cleanup.
 */

import type { SQSEvent, SQSBatchResponse } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import pg from "pg";

const { Pool } = pg;

const svc = bootstrap();

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return _pool;
}

interface FailedStepTask {
  tenantId: string;
  workflowRunId: string;
  stepIndex: number;
  action: string;
  payload: Record<string, unknown>;
  // SQS approximateReceiveCount from message attributes
  receiveCount?: number;
}

export async function processDlqBatch(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: Array<{ itemIdentifier: string }> = [];

  for (const record of event.Records) {
    try {
      const task = JSON.parse(record.body) as FailedStepTask;
      const receiveCount = parseInt(
        record.attributes?.ApproximateReceiveCount ?? "0",
        10,
      );

      await handleDeadLetterEntry({
        ...task,
        receiveCount,
        messageId: record.messageId,
        receivedAt: new Date(parseInt(record.attributes?.SentTimestamp ?? "0", 10)).toISOString(),
      });

      console.info("[dlq-processor] DLQ entry processed", {
        messageId: record.messageId,
        tenantId: task.tenantId,
        action: task.action,
        workflowRunId: task.workflowRunId,
        receiveCount,
      });
    } catch (err) {
      console.error("[dlq-processor] Failed to process DLQ entry", {
        messageId: record.messageId,
        error: (err as Error).message,
        stack: (err as Error).stack,
      });
      // Return as failure — message stays in DLQ
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

async function handleDeadLetterEntry(entry: FailedStepTask & { messageId: string; receivedAt: string }): Promise<void> {
  const pool = getPool();
  const { tenantId, workflowRunId, action, payload, receiveCount, messageId, receivedAt } = entry;

  // 1. Persist to dead_letter_queue table (for UI visibility and manual replay)
  try {
    await pool.query(
      `INSERT INTO dead_letter_queue
         (id, tenant_id, event_type, payload, error_reason, sqs_message_id, receive_count, dead_lettered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (sqs_message_id) DO UPDATE
         SET receive_count = EXCLUDED.receive_count,
             dead_lettered_at = EXCLUDED.dead_lettered_at`,
      [
        workflowRunId,
        tenantId,
        action,
        JSON.stringify(payload),
        `Exceeded max receive count (${receiveCount ?? "unknown"})`,
        messageId,
        receiveCount ?? 0,
        receivedAt,
      ],
    );
  } catch (dbErr) {
    console.error("[dlq-processor] Failed to persist DLQ entry to database", {
      workflowRunId,
      error: (dbErr as Error).message,
    });
    // Continue — don't let a DB error prevent audit logging
  }

  // 2. Update workflow/execution status to "failed" if applicable
  if (workflowRunId) {
    try {
      await pool.query(
        `UPDATE workflow_executions
         SET status = 'failed', completed_at = NOW()
         WHERE id = $1 AND status NOT IN ('completed', 'failed')`,
        [workflowRunId],
      );
      await pool.query(
        `UPDATE workflow_runs
         SET status = 'failed', completed_at = NOW()
         WHERE id = $1 AND status NOT IN ('completed', 'failed')`,
        [workflowRunId],
      );
    } catch {
      // Ignore — table may not exist for this action type
    }
  }

  // 3. Write audit log entry
  try {
    await svc.auditRepo.log({
      tenantId,
      actorType: "system",
      action: "workflow.dead_lettered",
      resourceType: "workflow_execution",
      resourceId: workflowRunId,
      details: {
        action,
        receiveCount,
        messageId,
        payloadKeys: Object.keys(payload),
      },
      correlationId: workflowRunId,
    });
  } catch (auditErr) {
    console.warn("[dlq-processor] Audit log failed", { error: (auditErr as Error).message });
  }

  // 4. Alert via cache flag (allows health endpoints to report DLQ depth)
  try {
    const alertKey = `dlq:alert:${tenantId}`;
    const existing = await svc.cacheRepo.get<{ count: number; lastAt: string }>(alertKey);
    await svc.cacheRepo.set(
      alertKey,
      { count: (existing?.count ?? 0) + 1, lastAt: new Date().toISOString() },
      86_400, // 24 hours
    );
  } catch (cacheErr) {
    console.warn("[dlq-processor] Cache alert failed", { error: (cacheErr as Error).message });
  }
}
