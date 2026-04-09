/**
 * orchestrator Lambda routes
 *
 * Ported from ai-orchestrator/src/ (Cloudflare Worker).
 * Uses bootstrap() service container instead of Cloudflare env bindings.
 *
 * Key translations:
 *   env.DB.prepare(...)          → pg pool
 *   env.ATLAS_SHARED_DB          → pg pool
 *   env.STEP_TASKS.send(...)     → svc.queueRepo.send(...)
 *   env.KV_CACHE                 → svc.cacheRepo
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import crypto from "crypto";
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

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
} as const;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function fail(status: number, message: string, code = "ERROR"): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ status: "error", code, message, timestamp: new Date().toISOString() }),
  };
}

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseAdapterUrls(val?: string): Record<string, string> {
  if (!val) return {};
  try {
    return JSON.parse(val) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();
  const qs = event.queryStringParameters ?? {};
  const requestId = event.requestContext.requestId;

  // ── Health (no auth) ──────────────────────────────────────────────────────
  if (path === "/health" && method === "GET") {
    return ok({
      status: "healthy",
      service: "orchestrator",
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // All remaining routes require authentication
  let auth: Awaited<ReturnType<typeof extractAuth>>;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
    return fail(401, "Authentication required", "UNAUTHORIZED");
  }

  const { tenantId } = auth;
  const pool = getPool();
  const ts = new Date().toISOString();

  // ── Event routes ───────────────────────────────────────────────────────────

  // POST /api/v1/events — publish event and fan-out to SQS
  if (path === "/api/v1/events" && method === "POST") {
    const b = parseBody(event) as {
      tenantId?: string;
      type?: string;
      source?: string;
      payload?: unknown;
      idempotencyKey?: string;
    };
    const evTenantId = b.tenantId ?? tenantId;
    if (auth.role !== "admin" && auth.tenantId !== evTenantId) {
      return fail(403, "Tenant access denied", "FORBIDDEN");
    }
    if (!b.type || !b.source) return fail(400, "type and source are required", "VALIDATION_FAILED");

    if (b.idempotencyKey) {
      const existing = await pool.query<{ id: string; status: string }>(
        "SELECT id, status FROM events WHERE idempotency_key = $1",
        [b.idempotencyKey],
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return ok({ status: "success", data: { id: row.id, status: row.status, deduplicated: true }, timestamp: ts });
      }
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, idempotency_key, created_at)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,NOW())`,
      [id, evTenantId, b.type, b.source, b.payload ? JSON.stringify(b.payload) : null, b.idempotencyKey ?? null],
    );

    // Fan-out: enqueue to SQS step tasks
    try {
      await svc.queueRepo.send({
        tenantId: evTenantId,
        workflowRunId: id,
        stepIndex: 0,
        action: "process_event",
        payload: { eventId: id, type: b.type, source: b.source, data: b.payload ?? {} },
      });
    } catch (qErr) {
      console.warn("[orchestrator] SQS enqueue failed", { id, error: (qErr as Error).message });
    }

    return ok({ status: "success", data: { id, type: b.type, source: b.source, status: "pending" }, timestamp: ts }, 201);
  }

  // GET /api/v1/events — list events for tenant
  if (path === "/api/v1/events" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const type = qs.type ?? undefined;

    const conditions = ["tenant_id = $1"];
    const vals: unknown[] = [tenantId];
    if (type) { conditions.push(`type = $${vals.length + 1}`); vals.push(type); }
    const where = conditions.join(" AND ");

    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", type, source, status, created_at as "createdAt"
       FROM events WHERE ${where} ORDER BY created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
      [...vals, limit, offset],
    );

    return ok({ status: "success", data: rows.rows, meta: { limit, offset }, timestamp: ts });
  }

  // ── Agent routes ───────────────────────────────────────────────────────────

  // POST /api/v1/agents — register a new agent
  if (path === "/api/v1/agents" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = parseBody(event) as {
      name?: string;
      description?: string;
      webhookUrl?: string;
      capabilities?: string[];
      eventTypes?: string[];
    };
    if (!b.name || !b.webhookUrl) return fail(400, "name and webhookUrl are required", "VALIDATION_FAILED");
    if (!b.eventTypes?.length) return fail(400, "eventTypes must not be empty", "VALIDATION_FAILED");

    const id = crypto.randomUUID();
    const secretBytes = crypto.randomBytes(32);
    const secret = secretBytes.toString("hex");

    await pool.query(
      `INSERT INTO agents
         (id, tenant_id, name, description, webhook_url, capabilities, event_types, status, secret, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,NOW())`,
      [id, tenantId, b.name, b.description ?? null, b.webhookUrl, JSON.stringify(b.capabilities ?? []), JSON.stringify(b.eventTypes), secret],
    );

    return ok({ status: "success", data: { id, name: b.name, status: "active", secret }, timestamp: ts }, 201);
  }

  // GET /api/v1/agents — list agents for tenant
  if (path === "/api/v1/agents" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 100);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", name, description, webhook_url as "webhookUrl",
              capabilities, event_types as "eventTypes", status, created_at as "createdAt"
       FROM agents WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
    return ok({ status: "success", data: rows.rows, meta: { limit, offset }, timestamp: ts });
  }

  // GET /api/v1/agents/:id — get agent
  const agentByIdMatch = path.match(/^\/api\/v1\/agents\/([^/]+)$/);
  if (agentByIdMatch && method === "GET") {
    const [, id] = agentByIdMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", name, description, webhook_url as "webhookUrl",
              capabilities, event_types as "eventTypes", status, created_at as "createdAt"
       FROM agents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Agent not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: ts });
  }

  // PATCH /api/v1/agents/:id — update agent
  if (agentByIdMatch && method === "PATCH") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, id] = agentByIdMatch;
    const b = parseBody(event) as { description?: string; webhookUrl?: string; status?: string; capabilities?: string[] };
    const updates: string[] = [];
    const vals: unknown[] = [];
    if (b.description !== undefined) { updates.push(`description = $${vals.length + 1}`); vals.push(b.description); }
    if (b.webhookUrl !== undefined) { updates.push(`webhook_url = $${vals.length + 1}`); vals.push(b.webhookUrl); }
    if (b.status !== undefined) { updates.push(`status = $${vals.length + 1}`); vals.push(b.status); }
    if (b.capabilities !== undefined) { updates.push(`capabilities = $${vals.length + 1}`); vals.push(JSON.stringify(b.capabilities)); }
    if (updates.length === 0) return fail(400, "No fields to update", "VALIDATION_FAILED");
    vals.push(id, tenantId);
    await pool.query(
      `UPDATE agents SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${vals.length - 1} AND tenant_id = $${vals.length}`,
      vals,
    );
    const updated = await pool.query(
      `SELECT id, name, status, webhook_url as "webhookUrl" FROM agents WHERE id = $1`,
      [id],
    );
    return ok({ status: "success", data: updated.rows[0], timestamp: ts });
  }

  // ── Workflow routes ─────────────────────────────────────────────────────────

  // POST /api/v1/workflows — start a workflow
  if (path === "/api/v1/workflows" && method === "POST") {
    const b = parseBody(event) as {
      definitionId?: string;
      definitionName?: string;
      steps?: Array<{ id: string; name: string; handler: string; timeoutMs: number }>;
      context?: Record<string, unknown>;
      globalTimeoutMs?: number;
    };
    if (!b.definitionId || !b.steps?.length) {
      return fail(400, "definitionId and steps are required", "VALIDATION_FAILED");
    }

    const workflowId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO workflow_runs (id, tenant_id, definition_id, status, context, created_at)
       VALUES ($1,$2,$3,'running',$4,NOW())`,
      [workflowId, tenantId, b.definitionId, JSON.stringify(b.context ?? {})],
    );

    // Enqueue first step
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: workflowId,
      stepIndex: 0,
      action: b.steps[0].handler,
      payload: { definition: { steps: b.steps, globalTimeoutMs: b.globalTimeoutMs ?? 300_000 }, context: b.context ?? {} },
    });

    return ok({ status: "success", data: { workflowId, status: "running" }, timestamp: ts }, 201);
  }

  // GET /api/v1/workflows/:id — get workflow run status
  const workflowRunMatch = path.match(/^\/api\/v1\/workflows\/([^/]+)$/);
  if (workflowRunMatch && method === "GET") {
    const [, id] = workflowRunMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", definition_id as "definitionId", status, context,
              created_at as "createdAt", completed_at as "completedAt"
       FROM workflow_runs WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Workflow run not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: ts });
  }

  // ── Automation routes ──────────────────────────────────────────────────────

  // POST /api/v1/automation/execute — execute JML/automation workflow
  if (path === "/api/v1/automation/execute" && method === "POST") {
    const b = parseBody(event) as {
      workflowType?: string;
      subjectRef?: string;
      idempotencyKey?: string;
    };
    const validTypes = ["joiner", "mover", "leaver"];
    if (!b.workflowType || !validTypes.includes(b.workflowType)) {
      return fail(400, `workflowType must be one of: ${validTypes.join(", ")}`, "VALIDATION_FAILED");
    }

    if (b.idempotencyKey) {
      const existing = await pool.query<{ id: string; status: string }>(
        `SELECT id, status FROM workflow_executions WHERE idempotency_key = $1 AND tenant_id = $2`,
        [b.idempotencyKey, tenantId],
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return ok({ status: "success", data: { id: row.id, status: row.status, idempotentHit: true }, timestamp: ts });
      }
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workflow_executions (id, tenant_id, workflow_type, subject_ref, status, idempotency_key, created_at)
       VALUES ($1,$2,$3,$4,'pending',$5,NOW())`,
      [id, tenantId, b.workflowType, b.subjectRef ?? null, b.idempotencyKey ?? null],
    );

    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: b.workflowType,
      payload: { subjectRef: b.subjectRef },
    });

    return ok({ status: "success", data: { id, status: "pending", idempotentHit: false }, timestamp: ts }, 202);
  }

  // GET /api/v1/automation/executions/:id — get automation execution
  const automationExecMatch = path.match(/^\/api\/v1\/automation\/executions\/([^/]+)$/);
  if (automationExecMatch && method === "GET") {
    const [, id] = automationExecMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", workflow_type as "workflowType",
              subject_ref as "subjectRef", status, created_at as "createdAt",
              completed_at as "completedAt"
       FROM workflow_executions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Execution not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: ts });
  }

  // ── Dead-letter queue routes ────────────────────────────────────────────────
  // Ported from ai-orchestrator/src/routes/dead-letter.ts

  // GET /api/v1/dead-letter — list dead letter entries (tenant-scoped)
  if (path === "/api/v1/dead-letter" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 100);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const agentId = qs.agentId ?? undefined;

    const conditions = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    if (agentId) { conditions.push(`agent_id = $${params.length + 1}`); params.push(agentId); }
    const where = `WHERE ${conditions.join(" AND ")}`;

    const rows = await pool.query(
      `SELECT * FROM dead_letter_queue ${where} ORDER BY dead_lettered_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const countRow = await pool.query(`SELECT COUNT(*) as total FROM dead_letter_queue ${where}`, params);

    return ok({
      status: "success",
      data: rows.rows,
      meta: { total: parseInt(countRow.rows[0]?.total ?? "0", 10), limit, offset },
      timestamp: ts,
    });
  }

  // GET /api/v1/dead-letter/stats/summary — DLQ stats
  if (path === "/api/v1/dead-letter/stats/summary" && method === "GET") {
    const total = await pool.query(
      "SELECT COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL",
    );
    const byAgent = await pool.query(
      "SELECT agent_id, COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL GROUP BY agent_id",
    );
    const byType = await pool.query(
      "SELECT event_type, COUNT(*) as count FROM dead_letter_queue WHERE replay_status IS NULL GROUP BY event_type",
    );
    return ok({
      status: "success",
      data: {
        depth: parseInt(total.rows[0]?.count ?? "0", 10),
        byAgent: byAgent.rows,
        byEventType: byType.rows,
      },
      timestamp: ts,
    });
  }

  // GET /api/v1/dead-letter/:id — get single dead-letter entry
  const dlqEntryMatch = path.match(/^\/api\/v1\/dead-letter\/([^/]+)$/);
  if (dlqEntryMatch && method === "GET") {
    const [, id] = dlqEntryMatch;
    const row = await pool.query(
      "SELECT * FROM dead_letter_queue WHERE id = $1",
      [id],
    );
    if (row.rows.length === 0) return fail(404, "Dead letter entry not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: ts });
  }

  // POST /api/v1/dead-letter/:id/replay — replay a dead letter entry
  const dlqReplayMatch = path.match(/^\/api\/v1\/dead-letter\/([^/]+)\/replay$/);
  if (dlqReplayMatch && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, id] = dlqReplayMatch;

    const row = await pool.query<{ id: string; payload: string; event_type: string; tenant_id: string }>(
      "SELECT id, payload, event_type, tenant_id FROM dead_letter_queue WHERE id = $1",
      [id],
    );
    if (row.rows.length === 0) return fail(404, "Dead letter entry not found", "NOT_FOUND");

    const entry = row.rows[0];
    try {
      // Re-enqueue the payload
      await svc.queueRepo.send({
        tenantId: entry.tenant_id,
        workflowRunId: id,
        stepIndex: 0,
        action: "replay_dlq",
        payload: JSON.parse(entry.payload ?? "{}") as Record<string, unknown>,
      });

      await pool.query(
        `UPDATE dead_letter_queue SET replay_status = 'replayed', replayed_at = NOW() WHERE id = $1`,
        [id],
      );

      return ok({ status: "success", data: { id, replayed: true }, timestamp: ts });
    } catch (replayErr) {
      return fail(400, (replayErr as Error).message, "REPLAY_FAILED");
    }
  }

  // POST /api/v1/dead-letter/replay-all — replay all unreplayed entries
  if (path === "/api/v1/dead-letter/replay-all" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const filterTenantId = qs.tenantId ?? tenantId;
    const conditions = ["replay_status IS NULL", "tenant_id = $1"];
    const params: unknown[] = [filterTenantId];
    const where = `WHERE ${conditions.join(" AND ")}`;

    const entries = await pool.query<{ id: string; payload: string; event_type: string; tenant_id: string }>(
      `SELECT id, payload, event_type, tenant_id FROM dead_letter_queue ${where} LIMIT 100`,
      params,
    );

    let replayed = 0;
    let failed = 0;
    for (const entry of entries.rows) {
      try {
        await svc.queueRepo.send({
          tenantId: entry.tenant_id,
          workflowRunId: entry.id,
          stepIndex: 0,
          action: "replay_dlq",
          payload: JSON.parse(entry.payload ?? "{}") as Record<string, unknown>,
        });
        await pool.query(
          `UPDATE dead_letter_queue SET replay_status = 'replayed', replayed_at = NOW() WHERE id = $1`,
          [entry.id],
        );
        replayed++;
      } catch {
        failed++;
      }
    }

    return ok({ status: "success", data: { total: entries.rows.length, replayed, failed }, timestamp: ts });
  }

  // ── JML routes ──────────────────────────────────────────────────────────────

  // GET /api/v1/jml/policy — get JML policy for tenant
  if (path === "/api/v1/jml/policy" && method === "GET") {
    const row = await pool.query(
      `SELECT tenant_id as "tenantId", policy FROM jml_policies WHERE tenant_id = $1`,
      [tenantId],
    );
    const policy = row.rows.length > 0 ? row.rows[0].policy : { tenantId, enabled: false, rules: [] };
    return ok({ status: "success", data: policy, timestamp: ts });
  }

  // PUT /api/v1/jml/policy — update JML policy for tenant
  if (path === "/api/v1/jml/policy" && method === "PUT") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = parseBody(event) as Record<string, unknown>;
    const policy = { ...b, tenantId };
    await pool.query(
      `INSERT INTO jml_policies (tenant_id, policy, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET policy = EXCLUDED.policy, updated_at = NOW()`,
      [tenantId, JSON.stringify(policy)],
    );
    return ok({ status: "success", data: policy, timestamp: ts });
  }

  // POST /api/v1/jml/trigger — manually trigger JML for a user
  if (path === "/api/v1/jml/trigger" && method === "POST") {
    const b = parseBody(event) as {
      userId?: string;
      email?: string;
      changeType?: string;
      delta?: Record<string, unknown>;
    };
    if (!b.userId || !b.changeType) return fail(400, "userId and changeType are required", "VALIDATION_FAILED");

    const validTypes = ["joiner", "mover", "leaver"];
    if (!validTypes.includes(b.changeType)) {
      return fail(400, `changeType must be one of: ${validTypes.join(", ")}`, "VALIDATION_FAILED");
    }

    const runId = crypto.randomUUID();
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: runId,
      stepIndex: 0,
      action: b.changeType,
      payload: { userId: b.userId, email: b.email, delta: b.delta ?? {}, source: "manual_trigger" },
    });

    return ok({ status: "success", data: { runId, triggered: true }, timestamp: ts });
  }

  // ── Directory routes ───────────────────────────────────────────────────────

  // POST /api/v1/directory/sync — proxy sync request to configured adapter
  if (path === "/api/v1/directory/sync" && method === "POST") {
    const b = parseBody(event) as { provider?: string };
    if (!b.provider) return fail(400, "provider is required", "VALIDATION_FAILED");

    const adapterUrls = parseAdapterUrls(process.env.ADAPTER_URLS);    const adapterUrl = adapterUrls[b.provider];
    if (!adapterUrl) return fail(501, `No adapter configured for provider: ${b.provider}`, "NOT_IMPLEMENTED");

    try {
      const res = await fetch(`${adapterUrl}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          "X-Correlation-ID": requestId,
          "X-API-Key": process.env.INTERNAL_API_KEY ?? "",
        },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json() as unknown;
      return ok({ status: "success", data, upstream: b.provider, timestamp: ts });
    } catch (e) {
      return fail(502, `Adapter sync failed: ${(e as Error).message}`, "UPSTREAM_ERROR");
    }
  }

  // GET /api/v1/discovery — discovery sync status
  if (path === "/api/v1/discovery" && method === "GET") {
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", provider, status, last_sync_at as "lastSyncAt", created_at as "createdAt"
       FROM discovery_sync WHERE tenant_id = $1 ORDER BY last_sync_at DESC`,
      [tenantId],
    );
    return ok({ status: "success", data: rows.rows, timestamp: ts });
  }

  // POST /api/v1/discovery/sync — trigger discovery sync
  if (path === "/api/v1/discovery/sync" && method === "POST") {
    const b = parseBody(event) as { provider?: string };
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO discovery_sync (id, tenant_id, provider, status, last_sync_at, created_at)
       VALUES ($1,$2,$3,'pending',NOW(),NOW())
       ON CONFLICT (tenant_id, provider) DO UPDATE SET status = 'pending', last_sync_at = NOW()`,
      [id, tenantId, b.provider ?? "all"],
    );

    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: "discovery_sync",
      payload: { provider: b.provider ?? "all" },
    });

    return ok({ status: "success", data: { id, status: "pending" }, timestamp: ts }, 202);
  }

  // ── Events (continued) ─────────────────────────────────────────────────────

  // GET /api/v1/events/:id — get single event
  const eventByIdMatch = path.match(/^\/api\/v1\/events\/([^/]+)$/);
  if (eventByIdMatch && method === "GET") {
    const [, id] = eventByIdMatch;
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", type, source, payload, status,
              idempotency_key as "idempotencyKey", created_at as "createdAt"
       FROM events WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (result.rows.length === 0) return fail(404, "Event not found", "NOT_FOUND");
    return ok({ status: "success", data: result.rows[0], timestamp: ts });
  }

  // ── Agents (continued) ─────────────────────────────────────────────────────

  // DELETE /api/v1/agents/:id — deregister agent
  if (agentByIdMatch && method === "DELETE") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, id] = agentByIdMatch;
    const existing = await pool.query(
      "SELECT id FROM agents WHERE id = $1 AND tenant_id = $2",
      [id, tenantId],
    );
    if (existing.rows.length === 0) return fail(404, "Agent not found", "NOT_FOUND");
    // Delete subscriptions first (cascade), then agent
    // Use subquery to ensure tenant isolation
    await pool.query(
      `DELETE FROM event_subscriptions WHERE agent_id = $1
       AND agent_id IN (SELECT id FROM agents WHERE tenant_id = $2)`,
      [id, tenantId],
    );
    await pool.query("DELETE FROM agents WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    return ok({ status: "success", data: { id, deleted: true }, timestamp: ts });
  }

  // POST /api/v1/agents/:id/subscriptions — add event subscription
  const agentSubsMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/subscriptions$/);
  if (agentSubsMatch && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const [, agentId] = agentSubsMatch;
    const b = parseBody(event) as { eventType?: string; filterExpression?: Record<string, unknown> | null };
    if (!b.eventType) return fail(400, "eventType is required", "VALIDATION_FAILED");
    const agent = await pool.query(
      "SELECT id FROM agents WHERE id = $1 AND tenant_id = $2",
      [agentId, tenantId],
    );
    if (agent.rows.length === 0) return fail(404, "Agent not found", "NOT_FOUND");
    const subId = crypto.randomUUID();
    // Convert filterExpression to JSONB-compatible format
    const filterExpr = b.filterExpression ? JSON.stringify(b.filterExpression) : null;
    try {
      await pool.query(
        `INSERT INTO event_subscriptions (id, agent_id, event_type, filter_expression, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [subId, agentId, b.eventType, filterExpr],
      );
    } catch (e: unknown) {
      // Check Postgres error code 23505 for unique violation
      const pgError = e as { code?: string };
      if (pgError.code === "23505") {
        return fail(409, "Already subscribed to this event type", "CONFLICT");
      }
      throw e;
    }
    return ok({
      status: "success",
      data: { id: subId, agentId, eventType: b.eventType },
      timestamp: ts,
    }, 201);
  }

  // POST /api/v1/agents/:id/health — report health check result
  const agentHealthMatch = path.match(/^\/api\/v1\/agents\/([^/]+)\/health$/);
  if (agentHealthMatch && method === "POST") {
    const [, agentId] = agentHealthMatch;
    const agent = await pool.query(
      "SELECT id, health_check_url as healthUrl FROM agents WHERE id = $1 AND tenant_id = $2",
      [agentId, tenantId],
    );
    if (agent.rows.length === 0) return fail(404, "Agent not found", "NOT_FOUND");
    let healthStatus = "unhealthy";
    const healthUrl = agent.rows[0].healthUrl as string | null;
    if (healthUrl) {
      // SSRF protection: validate URL scheme and block private IP ranges
      try {
        const url = new URL(healthUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          console.warn(`[orchestrator] Blocked health check to non-HTTP URL: ${url.protocol}`);
        } else {
          // Block private IPs and localhost (basic SSRF protection)
          const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
          const isPrivateIP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(url.hostname);
          if (blockedHosts.includes(url.hostname) || isPrivateIP) {
            console.warn(`[orchestrator] Blocked health check to private/local address: ${url.hostname}`);
          } else {
            const res = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(5000) });
            healthStatus = res.ok ? "healthy" : "unhealthy";
          }
        }
      } catch {
        healthStatus = "unhealthy";
      }
    }
    await pool.query(
      `UPDATE agents SET last_health_check_at = NOW(), last_health_status = $1,
       status = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4`,
      [healthStatus, healthStatus === "unhealthy" ? "unhealthy" : "active", agentId, tenantId],
    );
    return ok({ status: "success", data: { id: agentId, healthStatus }, timestamp: ts });
  }

  // ── Workflows (continued) ─────────────────────────────────────────────────

  // POST /api/v1/workflows/:id/steps/:stepId/complete — complete a workflow step
  const stepCompleteMatch = path.match(/^\/api\/v1\/workflows\/([^/]+)\/steps\/([^/]+)\/complete$/);
  if (stepCompleteMatch && method === "POST") {
    const [, workflowId, stepId] = stepCompleteMatch;
    const stepIndex = parseInt(stepId, 10);
    if (Number.isNaN(stepIndex) || stepIndex < 0) {
      return fail(400, "stepId must be a valid non-negative integer", "VALIDATION_FAILED");
    }
    const b = parseBody(event) as Record<string, unknown>;
    // Verify workflow belongs to tenant
    const wf = await pool.query(
      "SELECT id FROM workflow_runs WHERE id = $1 AND tenant_id = $2",
      [workflowId, tenantId],
    );
    if (wf.rows.length === 0) return fail(404, "Workflow not found", "NOT_FOUND");
    // Enqueue step completion
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: workflowId,
      stepIndex,
      action: "step_complete",
      payload: b,
    });
    return ok({ status: "success", data: { workflowId, stepId, status: "completed" }, timestamp: ts });
  }

  // POST /api/v1/workflows/:id/steps/:stepId/fail — fail a workflow step
  const stepFailMatch = path.match(/^\/api\/v1\/workflows\/([^/]+)\/steps\/([^/]+)\/fail$/);
  if (stepFailMatch && method === "POST") {
    const [, workflowId, stepId] = stepFailMatch;
    const stepIndex = parseInt(stepId, 10);
    if (Number.isNaN(stepIndex) || stepIndex < 0) {
      return fail(400, "stepId must be a valid non-negative integer", "VALIDATION_FAILED");
    }
    const b = parseBody(event) as { error?: string };
    // Verify workflow belongs to tenant
    const wf = await pool.query(
      "SELECT id FROM workflow_runs WHERE id = $1 AND tenant_id = $2",
      [workflowId, tenantId],
    );
    if (wf.rows.length === 0) return fail(404, "Workflow not found", "NOT_FOUND");
    // Enqueue step failure
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: workflowId,
      stepIndex,
      action: "step_fail",
      payload: { error: b.error ?? "Unknown error" },
    });
    return ok({ status: "success", data: { workflowId, stepId, status: "failed" }, timestamp: ts });
  }

  // POST /api/v1/workflows/:id/cancel — cancel a workflow
  // Note: schema constraint allows 'queued|running|completed|failed|compensating', so we use 'failed'
  // with error text indicating cancellation rather than unsupported 'cancelled' status.
  const workflowCancelMatch = path.match(/^\/api\/v1\/workflows\/([^/]+)\/cancel$/);
  if (workflowCancelMatch && method === "POST") {
    const [, workflowId] = workflowCancelMatch;
    // Verify workflow belongs to tenant
    const wf = await pool.query(
      "SELECT id, status FROM workflow_runs WHERE id = $1 AND tenant_id = $2",
      [workflowId, tenantId],
    );
    if (wf.rows.length === 0) return fail(404, "Workflow not found", "NOT_FOUND");
    await pool.query(
      `UPDATE workflow_runs SET status = 'failed', error = 'Cancelled by user', completed_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [workflowId, tenantId],
    );
    return ok({ status: "success", data: { workflowId, status: "cancelled" }, timestamp: ts });
  }

  // ── Automation routes ─────────────────────────────────────────────────────

  // POST /api/v1/automation/evaluate — evaluate automation rules against an event
  if (path === "/api/v1/automation/evaluate" && method === "POST") {
    const b = parseBody(event) as {
      tenantId?: string;
      type?: string;
      source?: string;
      payload?: Record<string, unknown>;
    };
    // Enforce tenant isolation
    const evTenantId = b.tenantId ?? tenantId;
    if (auth.role !== "admin" && evTenantId !== tenantId) {
      return fail(403, "Tenant mismatch", "FORBIDDEN");
    }
    if (!b.type || !b.source) return fail(400, "type and source are required", "VALIDATION_FAILED");
    // Fetch and evaluate automation rules
    const rules = await pool.query(
      `SELECT id, name, trigger_type, conditions, actions, enabled FROM automation_rules
       WHERE tenant_id = $1 AND enabled = true`,
      [evTenantId],
    );
    const matchedRules: Array<{ id: string; name: string }> = [];
    for (const rule of rules.rows) {
      // Simple trigger type matching
      if (rule.trigger_type === b.type || rule.trigger_type === "*") {
        matchedRules.push({ id: rule.id, name: rule.name });
      }
    }
    return ok({
      status: "success",
      data: { evaluated: rules.rows.length, matched: matchedRules.length, rules: matchedRules },
      timestamp: ts,
    });
  }

  // GET /api/v1/automation/rules — list automation rules for tenant
  if (path === "/api/v1/automation/rules" && method === "GET") {
    const rows = await pool.query(
      `SELECT id, name, trigger_type, enabled, run_count, error_count, last_run_at, last_status, created_at
       FROM automation_rules WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return ok({ status: "success", data: rows.rows, timestamp: ts });
  }

  // GET /api/v1/automation/stats — get automation execution stats
  if (path === "/api/v1/automation/stats" && method === "GET") {
    const stats = await pool.query(
      `SELECT
         COUNT(*) as total_rules,
         SUM(run_count) as total_runs,
         SUM(error_count) as total_errors,
         AVG(run_count) as avg_runs_per_rule
       FROM automation_rules WHERE tenant_id = $1`,
      [tenantId],
    );
    const recentRuns = await pool.query(
      `SELECT id, name, last_run_at, last_status FROM automation_rules
       WHERE tenant_id = $1 AND last_run_at IS NOT NULL ORDER BY last_run_at DESC LIMIT 10`,
      [tenantId],
    );
    return ok({
      status: "success",
      data: {
        summary: stats.rows[0],
        recentRuns: recentRuns.rows,
      },
      timestamp: ts,
    });
  }

  // ── JML routes (continued) ────────────────────────────────────────────────

  // GET /api/v1/jml/changelog — list directory change log entries
  if (path === "/api/v1/jml/changelog" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;
    const action = qs.action ?? undefined; // joiner | leaver | mover | rehire
    const conditions = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    if (action) {
      conditions.push(`jml_action = $${params.length + 1}`);
      params.push(action);
    }
    const where = conditions.join(" AND ");
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", user_id as "userId", jml_action as "jmlAction",
              delta, source, created_at as "createdAt"
       FROM directory_changelog WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return ok({ status: "success", data: rows.rows, meta: { limit, offset }, timestamp: ts });
  }

  // GET /api/v1/jml/runs — list JML workflow runs
  if (path === "/api/v1/jml/runs" && method === "GET") {
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const status = qs.status ?? undefined;
    const type = qs.type ?? undefined;
    const conditions = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    if (type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(type);
    }
    const where = conditions.join(" AND ");
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", definition_id as "definitionId", type, status,
              context, created_at as "createdAt", completed_at as "completedAt"
       FROM workflow_runs WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length + 1}`,
      [...params, limit],
    );
    return ok({ status: "success", data: rows.rows, timestamp: ts });
  }

  // GET /api/v1/jml/runs/:id — get workflow run detail
  const jmlRunMatch = path.match(/^\/api\/v1\/jml\/runs\/([^/]+)$/);
  if (jmlRunMatch && method === "GET") {
    const [, runId] = jmlRunMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", definition_id as "definitionId", type, status,
              context, created_at as "createdAt", completed_at as "completedAt"
       FROM workflow_runs WHERE id = $1 AND tenant_id = $2`,
      [runId, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Run not found", "NOT_FOUND");
    return ok({ status: "success", data: { run: row.rows[0], liveState: null }, timestamp: ts });
  }

  return fail(404, "Not Found", "NOT_FOUND");
}
