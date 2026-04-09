/**
 * orchestrator SQS processor
 *
 * Processes step-task messages from the atlasit-step-tasks SQS queue.
 * Replaces the Cloudflare Queue consumer in ai-orchestrator/src/index.ts.
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

interface StepTaskMessage {
  tenantId: string;
  workflowRunId: string;
  stepIndex: number;
  action: string;
  payload: Record<string, unknown>;
}

export async function processSqsBatch(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: Array<{ itemIdentifier: string }> = [];

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body) as StepTaskMessage;
      await processStepTask(message);
    } catch (err) {
      console.error("[orchestrator:sqs] Failed to process message", {
        messageId: record.messageId,
        error: (err as Error).message,
        stack: (err as Error).stack,
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

async function processStepTask(task: StepTaskMessage): Promise<void> {
  const pool = getPool();
  const { tenantId, workflowRunId, stepIndex, action, payload } = task;

  console.info("[orchestrator:sqs] Processing step task", {
    tenantId,
    workflowRunId,
    stepIndex,
    action,
  });

  try {
    switch (action) {
      case "joiner":
      case "mover":
      case "leaver":
        await executeJmlAction(tenantId, workflowRunId, action, payload, pool);
        break;

      case "process_event":
        await processEvent(tenantId, workflowRunId, payload, pool);
        break;

      case "discovery_sync":
        await triggerDiscoverySync(tenantId, payload, pool);
        break;

      case "replay_dlq":
        // Re-process a dead-letter entry — log and mark as processed
        console.info("[orchestrator:sqs] Replaying DLQ entry", { workflowRunId, tenantId });
        break;

      default:
        console.warn("[orchestrator:sqs] Unknown action, forwarding to DLQ handling", { action, workflowRunId });
        await moveToDlq(tenantId, workflowRunId, action, payload, `Unknown action: ${action}`, pool);
    }
  } catch (err) {
    const errMsg = (err as Error).message;
    console.error("[orchestrator:sqs] Step task failed", { workflowRunId, action, error: errMsg });

    // Move to dead letter for permanent failures
    await moveToDlq(tenantId, workflowRunId, action, payload, errMsg, pool);
    throw err; // Re-throw so SQS knows the message failed
  }
}

async function executeJmlAction(
  tenantId: string,
  runId: string,
  action: string,
  payload: Record<string, unknown>,
  pool: pg.Pool,
): Promise<void> {
  await pool.query(
    `UPDATE workflow_executions SET status = 'running', started_at = NOW() WHERE id = $1`,
    [runId],
  );

  // Simulate JML execution — in production, this would call the JML engine
  console.info("[orchestrator:sqs] Executing JML action", { tenantId, runId, action, payload });

  await pool.query(
    `UPDATE workflow_executions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [runId],
  );

  // Record audit trail
  await svc.auditRepo.log({
    tenantId,
    actorType: "system",
    action: `jml.${action}.completed`,
    resourceType: "workflow_execution",
    resourceId: runId,
    details: { subjectRef: payload.subjectRef as string | undefined },
    correlationId: runId,
  });
}

async function processEvent(
  tenantId: string,
  eventId: string,
  payload: Record<string, unknown>,
  pool: pg.Pool,
): Promise<void> {
  await pool.query(
    `UPDATE events SET status = 'processing' WHERE id = $1`,
    [eventId],
  );

  const eventType = payload.type as string | undefined;
  console.info("[orchestrator:sqs] Processing event", { tenantId, eventId, type: eventType });

  // Mark event as processed
  await pool.query(
    `UPDATE events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
    [eventId],
  );
}

async function triggerDiscoverySync(
  tenantId: string,
  payload: Record<string, unknown>,
  pool: pg.Pool,
): Promise<void> {
  const provider = payload.provider as string ?? "all";
  console.info("[orchestrator:sqs] Triggering discovery sync", { tenantId, provider });

  await pool.query(
    `UPDATE discovery_sync SET status = 'running' WHERE tenant_id = $1 AND provider = $2`,
    [tenantId, provider],
  );

  // In production, this would call the adapter worker to sync
  await pool.query(
    `UPDATE discovery_sync SET status = 'completed', last_sync_at = NOW() WHERE tenant_id = $1 AND provider = $2`,
    [tenantId, provider],
  );
}

async function moveToDlq(
  tenantId: string,
  workflowRunId: string,
  action: string,
  payload: Record<string, unknown>,
  reason: string,
  pool: pg.Pool,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO dead_letter_queue (id, tenant_id, event_type, payload, error_reason, dead_lettered_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT DO NOTHING`,
      [workflowRunId, tenantId, action, JSON.stringify(payload), reason],
    );
  } catch (dlqErr) {
    console.error("[orchestrator:sqs] Failed to write to DLQ", {
      workflowRunId,
      error: (dlqErr as Error).message,
    });
  }
}
