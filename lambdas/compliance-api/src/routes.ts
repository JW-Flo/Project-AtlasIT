/**
 * compliance-api Lambda routes
 *
 * Ported from compliance-worker/src/ (Cloudflare Worker).
 * Uses bootstrap() service container instead of Cloudflare env bindings.
 *
 * Key translations:
 *   env.ATLAS_SHARED_DB.prepare(...)  → pg pool (direct SQL)
 *   env.EVIDENCE_BUCKET.put(...)      → svc.evidenceRepo.put(...)
 *   env.EVIDENCE_BUCKET.get(...)      → svc.evidenceRepo.get(...)
 *   env.KV_CACHE.get/put(...)         → svc.cacheRepo.get/set(...)
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

const SNAPSHOT_TTL_SECONDS = 300;

// Evidence thresholds for compliance status determination
const MIN_EVIDENCE_FOR_VERIFIED = 3;
const MIN_EVIDENCE_FOR_IMPLEMENTED = 1;

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

/** Compute SHA-256 hex hash of canonical JSON content. */
function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
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
      service: "compliance-api",
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

  // ── Evidence routes ────────────────────────────────────────────────────────

  // GET /api/v1/evidence — list evidence for tenant
  if (path === "/api/v1/evidence" && method === "GET") {
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "50", 10) || 50, 1), 200);
    const cursor = qs.cursor ?? null;

    try {
      const conditions = [`tenant_id = $1`];
      const bindings: unknown[] = [tenantId];
      if (cursor) {
        conditions.push(`created_at < $${bindings.length + 1}`);
        bindings.push(cursor);
      }
      const where = conditions.join(" AND ");
      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", framework, control_id as "controlId",
                control_name as "controlName", evidence_type as "evidenceType",
                source, source_id as "sourceId", actor, subject, metadata, created_at as "createdAt"
         FROM compliance_evidence WHERE ${where}
         ORDER BY created_at DESC LIMIT $${bindings.length + 1}`,
        [...bindings, limit + 1],
      );
      const items = rows.rows.slice(0, limit);
      const hasNext = rows.rows.length > limit;
      const nextCursor = hasNext ? items[items.length - 1]?.["createdAt"] ?? null : null;

      const countRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = $1`,
        [tenantId],
      );

      return ok({
        status: "success",
        data: { items, nextCursor, count: items.length, total: parseInt(countRow.rows[0]?.cnt ?? "0", 10) },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evidence.list.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to list evidence", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/evidence — ingest evidence
  if (path === "/api/v1/evidence" && method === "POST") {
    const b = parseBody(event) as {
      pack?: string;
      subject?: string;
      content?: unknown;
      framework?: string;
      controlId?: string;
      controlName?: string;
      source?: string;
    };
    if (!b.content) return fail(400, "content is required", "VALIDATION_FAILED");

    const canonical = JSON.stringify(b.content);
    const hash = sha256(canonical);
    const key = `evidence/${tenantId}/${hash}`;

    try {
      // Store in S3 evidence bucket
      await svc.evidenceRepo.put(key, canonical, "application/json");

      // Record in PostgreSQL. ON CONFLICT (source_id) DO NOTHING implements
      // idempotent ingest: re-submitting the same content hash is a no-op,
      // which is the desired behaviour for evidence deduplication.
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
         ON CONFLICT (source_id) DO NOTHING`,
        [
          id, tenantId, b.framework ?? null, b.controlId ?? null, b.controlName ?? null,
          "manual", b.source ?? "api", hash, auth.userId, b.subject ?? null,
          JSON.stringify({ pack: b.pack, hash }),
        ],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: "evidence.ingested",
        resourceType: "evidence",
        resourceId: hash,
        correlationId: requestId,
      });

      return ok({ status: "success", data: { id, hash, key }, timestamp: new Date().toISOString() }, 201);
    } catch (e) {
      console.error("[compliance-api] evidence.ingest.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to ingest evidence", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/evidence/:hash — retrieve evidence object
  const evidenceHashMatch = path.match(/^\/api\/v1\/evidence\/([^/]+)$/);
  if (evidenceHashMatch && method === "GET") {
    const [, hash] = evidenceHashMatch;
    const key = `evidence/${tenantId}/${hash}`;
    try {
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Evidence not found", "NOT_FOUND");
      return ok({ status: "success", data: { hash, content: JSON.parse(content) }, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] evidence.get.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to retrieve evidence", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/evidence/:hash/verify — verify evidence integrity
  const evidenceVerifyMatch = path.match(/^\/api\/v1\/evidence\/([^/]+)\/verify$/);
  if (evidenceVerifyMatch && method === "GET") {
    const [, hash] = evidenceVerifyMatch;
    const key = `evidence/${tenantId}/${hash}`;
    try {
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Evidence not found", "NOT_FOUND");
      const actualHash = sha256(content);
      const verified = actualHash === hash;
      return ok({ status: "success", data: { hash, verified, actualHash }, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] evidence.verify.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to verify evidence", "INTERNAL_ERROR");
    }
  }

  // ── Compliance snapshot ─────────────────────────────────────────────────────

  // GET /api/compliance/snapshot — get compliance snapshot (tenant-scoped)
  if (path === "/api/compliance/snapshot" && (method === "GET" || method === "HEAD")) {
    const cacheKey = `snapshot:${tenantId}`;
    try {
      const cached = await svc.cacheRepo.get<unknown>(cacheKey);
      if (cached) {
        return ok({ status: "success", data: cached, cached: true, timestamp: new Date().toISOString() });
      }

      // Build snapshot from PostgreSQL
      const snapshot = await buildComplianceSnapshot(tenantId, pool);
      await svc.cacheRepo.set(cacheKey, snapshot, SNAPSHOT_TTL_SECONDS);

      return ok({ status: "success", data: snapshot, cached: false, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] snapshot.error", { requestId, tenantId, error: (e as Error).message });
      return fail(500, "Failed to build compliance snapshot", "INTERNAL_ERROR");
    }
  }

  // ── Policy routes ──────────────────────────────────────────────────────────

  // GET /api/v1/policies/templates — list policy templates
  if (path === "/api/v1/policies/templates" && method === "GET") {
    try {
      const rows = await pool.query(
        `SELECT id, key, name, description, framework, category, created_at as "createdAt"
         FROM policy_templates ORDER BY framework, name`,
      );
      return ok({ status: "success", data: rows.rows, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] policy.templates.error", { requestId, error: (e as Error).message });
      // Return empty list if table doesn't exist yet
      return ok({ status: "success", data: [], timestamp: new Date().toISOString() });
    }
  }

  // POST /api/v1/policies/generate — generate policy document
  if (path === "/api/v1/policies/generate" && method === "POST") {
    const b = parseBody(event) as {
      templateKey?: string;
      context?: Record<string, unknown>;
      framework?: string;
    };
    if (!b.templateKey) return fail(400, "templateKey is required", "VALIDATION_FAILED");

    try {
      const template = await pool.query(
        `SELECT * FROM policy_templates WHERE key = $1`,
        [b.templateKey],
      );
      if (template.rows.length === 0) return fail(404, "Template not found", "NOT_FOUND");

      const id = crypto.randomUUID();
      const content = JSON.stringify({
        templateKey: b.templateKey,
        framework: b.framework ?? template.rows[0].framework,
        context: b.context ?? {},
        generatedAt: new Date().toISOString(),
        tenantId,
      });
      const hash = sha256(content);
      const key = `policies/${tenantId}/${hash}`;

      await svc.evidenceRepo.put(key, content, "application/json");
      await pool.query(
        `INSERT INTO generated_policies (id, tenant_id, template_key, hash, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, tenantId, b.templateKey, hash],
      );

      return ok({
        status: "success",
        data: { id, hash, key, templateKey: b.templateKey },
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (e) {
      console.error("[compliance-api] policy.generate.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to generate policy", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/policy/evaluate — evaluate a single policy
  if (path === "/api/v1/policy/evaluate" && method === "POST") {
    const b = parseBody(event) as { hash?: string; controlIds?: string[] };
    if (!b.hash) return fail(400, "hash is required", "VALIDATION_FAILED");

    try {
      const key = `policies/${tenantId}/${b.hash}`;
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Policy not found", "NOT_FOUND");

      // Run basic evaluation: check evidence for linked controls
      const controlIds = b.controlIds ?? [];
      const evaluations: Array<{ controlId: string; status: string }> = [];
      for (const controlId of controlIds) {
        const row = await pool.query(
          `SELECT COUNT(*) as cnt FROM compliance_evidence
           WHERE tenant_id = $1 AND control_id = $2`,
          [tenantId, controlId],
        );
        const hasEvidence = parseInt(row.rows[0]?.cnt ?? "0", 10) > 0;
        evaluations.push({ controlId, status: hasEvidence ? "implemented" : "not_started" });
      }

      return ok({ status: "success", data: { hash: b.hash, evaluations }, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] policy.evaluate.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to evaluate policy", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/policies/coverage — compliance coverage summary
  if (path === "/api/v1/policies/coverage" && method === "GET") {
    const framework = qs.framework ?? undefined;
    try {
      const conditions = ["tenant_id = $1"];
      const vals: unknown[] = [tenantId];
      if (framework) { conditions.push(`framework = $${vals.length + 1}`); vals.push(framework); }
      const where = conditions.join(" AND ");

      const rows = await pool.query(
        `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
         FROM compliance_evidence WHERE ${where}
         GROUP BY control_id, framework ORDER BY framework, control_id`,
        vals,
      );

      return ok({
        status: "success",
        data: {
          framework: framework ?? "all",
          controls: rows.rows,
          total: rows.rows.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] policy.coverage.error", { requestId, error: (e as Error).message });
      return fail(500, "Failed to compute coverage", "INTERNAL_ERROR");
    }
  }

  // ── CDT evaluation ─────────────────────────────────────────────────────────

  // GET /api/v1/cdt/evaluate — CDT (Compliance Decision Tree) evaluation
  if (path === "/api/v1/cdt/evaluate" && method === "GET") {
    const framework = qs.framework ?? undefined;
    try {
      const conditions = ["tenant_id = $1"];
      const vals: unknown[] = [tenantId];
      if (framework) { conditions.push(`framework = $${vals.length + 1}`); vals.push(framework); }
      const where = conditions.join(" AND ");

      const evidenceRows = await pool.query(
        `SELECT control_id as "controlId", framework, source, created_at as "createdAt"
         FROM compliance_evidence WHERE ${where}
         ORDER BY framework, control_id, created_at DESC`,
        vals,
      );

      // Group by control_id and compute status
      const controlMap = new Map<string, { controlId: string; framework?: string; evidenceCount: number; latestAt?: string; status: string }>();
      for (const row of evidenceRows.rows) {
        const key = `${row.framework ?? "unknown"}:${row.controlId}`;
        if (!controlMap.has(key)) {
          controlMap.set(key, { controlId: row.controlId, framework: row.framework, evidenceCount: 0, status: "not_started" });
        }
        const entry = controlMap.get(key)!;
        entry.evidenceCount++;
        entry.latestAt = entry.latestAt ?? row.createdAt;
        entry.status = entry.evidenceCount >= 3 ? "verified" : entry.evidenceCount >= 1 ? "implemented" : "not_started";
      }

      const evaluations = Array.from(controlMap.values());
      const totalScore = evaluations.length === 0 ? 0
        : evaluations.reduce((sum, e) => {
          const weights: Record<string, number> = { not_started: 0, in_progress: 0.25, implemented: 0.75, verified: 1.0 };
          return sum + (weights[e.status] ?? 0);
        }, 0) / evaluations.length;

      return ok({
        status: "success",
        data: { framework: framework ?? "all", evaluations, score: Math.round(totalScore * 100) },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] cdt.evaluate.error", { requestId, error: (e as Error).message });
      return fail(500, "CDT evaluation failed", "INTERNAL_ERROR");
    }
  }

  // ── Workflow automation routes ──────────────────────────────────────────────

  // POST /api/v1/workflows/execute — execute a workflow
  if (path === "/api/v1/workflows/execute" && method === "POST") {
    const b = parseBody(event) as {
      workflowType?: string;
      subjectRef?: string;
      idempotencyKey?: string;
    };
    if (!b.workflowType) return fail(400, "workflowType is required", "VALIDATION_FAILED");

    const validTypes = ["joiner", "mover", "leaver"];
    if (!validTypes.includes(b.workflowType)) {
      return fail(400, `workflowType must be one of: ${validTypes.join(", ")}`, "VALIDATION_FAILED");
    }

    if (b.idempotencyKey) {
      const existing = await pool.query(
        `SELECT id, status FROM workflow_executions WHERE idempotency_key = $1 AND tenant_id = $2`,
        [b.idempotencyKey, tenantId],
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return ok({
          status: "success",
          data: { id: row.id, status: row.status, idempotentHit: true },
          timestamp: new Date().toISOString(),
        });
      }
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workflow_executions (id, tenant_id, workflow_type, subject_ref, status, idempotency_key, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW())`,
      [id, tenantId, b.workflowType, b.subjectRef ?? null, b.idempotencyKey ?? null],
    );

    // Enqueue via SQS for async execution
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: b.workflowType,
      payload: { subjectRef: b.subjectRef },
    });

    return ok({
      status: "success",
      data: { id, status: "pending", idempotentHit: false },
      timestamp: new Date().toISOString(),
    }, 202);
  }

  // GET /api/v1/workflows/executions/:id — get workflow execution
  const workflowExecMatch = path.match(/^\/api\/v1\/workflows\/executions\/([^/]+)$/);
  if (workflowExecMatch && method === "GET") {
    const [, executionId] = workflowExecMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", workflow_type as "workflowType",
              subject_ref as "subjectRef", status, created_at as "createdAt",
              completed_at as "completedAt"
       FROM workflow_executions WHERE id = $1 AND tenant_id = $2`,
      [executionId, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Execution not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: new Date().toISOString() });
  }

  // ── Evidence routes (continued) ─────────────────────────────────────────────

  // POST /api/v1/evidence/collect — pull evidence from connected adapters
  if (path === "/api/v1/evidence/collect" && method === "POST") {
    // Get configured adapter URLs from env
    let adapterUrls: Record<string, string>;
    try {
      adapterUrls = JSON.parse(process.env.ADAPTER_URLS ?? "{}") as Record<string, string>;
    } catch (parseErr) {
      return fail(500, `Invalid ADAPTER_URLS configuration: ${(parseErr as Error).message}`, "CONFIG_ERROR");
    }
    if (Object.keys(adapterUrls).length === 0) {
      return ok({
        status: "success",
        data: { collected: 0, adapters: [], items: [] },
        timestamp: new Date().toISOString(),
      });
    }

    // Skip adapter calls if API key is not configured
    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      console.warn("[compliance-api] INTERNAL_API_KEY not configured, skipping adapter evidence collection");
      return ok({
        status: "success",
        data: { collected: 0, adapters: [], items: [], warning: "INTERNAL_API_KEY not configured" },
        timestamp: new Date().toISOString(),
      });
    }

    const allItems: Array<{
      adapter: string;
      type: string;
      status: string;
      controlRefs: string[];
      details: Record<string, unknown>;
    }> = [];
    const adaptersCollected: string[] = [];

    // Fetch evidence from each adapter
    for (const [slug, adapterUrl] of Object.entries(adapterUrls)) {
      try {
        const res = await fetch(`${adapterUrl}/api/evidence`, {
          method: "GET",
          headers: {
            "X-Tenant-ID": tenantId,
            "X-API-Key": internalApiKey,
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const data = await res.json() as { items?: Array<{ type: string; status: string; controlRefs?: string[]; details?: Record<string, unknown> }> };
          if (data.items?.length) {
            adaptersCollected.push(slug);
            for (const item of data.items) {
              allItems.push({
                adapter: slug,
                type: item.type,
                status: item.status,
                controlRefs: item.controlRefs ?? [],
                details: item.details ?? {},
              });
              // Store each item as compliance_evidence per control ref
              for (const controlRef of item.controlRefs ?? []) {
                const { framework, controlId } = parseControlRef(controlRef);
                try {
                  await pool.query(
                    `INSERT INTO compliance_evidence
                       (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                     ON CONFLICT (source_id) DO NOTHING`,
                    [
                      crypto.randomUUID(),
                      tenantId,
                      framework,
                      controlId,
                      controlRef,
                      "adapter_pull",
                      `adapter:${slug}`,
                      `${slug}:${item.type}`,
                      "system",
                      `${slug} ${item.type}`,
                      JSON.stringify({
                        impact: item.status === "pass" ? "positive" : item.status === "fail" ? "detrimental" : "neutral",
                        confidence: item.status === "unknown" ? 0.3 : 0.8,
                        details: item.details,
                      }),
                    ],
                  );
                } catch {
                  // Ignore duplicate insert errors
                }
              }
            }
          }
        }
      } catch {
        // Skip adapters that fail
      }
    }

    return ok({
      status: "success",
      data: { collected: allItems.length, adapters: adaptersCollected, items: allItems },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/evidence/search — search evidence
  if (path === "/api/evidence/search" && method === "GET") {
    const framework = qs.framework ?? undefined;
    const controlId = qs.controlId ?? undefined;
    const source = qs.source ?? undefined;
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;

    const conditions = ["tenant_id = $1"];
    const vals: unknown[] = [tenantId];

    if (framework) {
      conditions.push(`framework = $${vals.length + 1}`);
      vals.push(framework);
    }
    if (controlId) {
      conditions.push(`control_id = $${vals.length + 1}`);
      vals.push(controlId);
    }
    if (source) {
      conditions.push(`source = $${vals.length + 1}`);
      vals.push(source);
    }

    const where = conditions.join(" AND ");
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", framework, control_id as "controlId",
              control_name as "controlName", evidence_type as "evidenceType",
              source, source_id as "sourceId", actor, subject, metadata, created_at as "createdAt"
       FROM compliance_evidence WHERE ${where}
       ORDER BY created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
      [...vals, limit, offset],
    );

    const countRow = await pool.query(
      `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE ${where}`,
      vals,
    );

    return ok({
      status: "success",
      data: {
        items: rows.rows,
        total: parseInt(countRow.rows[0]?.cnt ?? "0", 10),
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/policies/evaluate-all — bulk evaluate all policies
  if (path === "/api/v1/policies/evaluate-all" && method === "POST") {
    // Evaluate all controls based on evidence
    const evidenceRows = await pool.query(
      `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
       FROM compliance_evidence WHERE tenant_id = $1
       GROUP BY control_id, framework`,
      [tenantId],
    );

    const evaluations: Array<{ controlId: string; framework: string; status: string; evidenceCount: number }> = [];
    for (const row of evidenceRows.rows) {
      const evidenceCount = parseInt(row.evidence_count, 10);
      let status = "not_started";
      if (evidenceCount >= MIN_EVIDENCE_FOR_VERIFIED) status = "verified";
      else if (evidenceCount >= MIN_EVIDENCE_FOR_IMPLEMENTED) status = "implemented";
      evaluations.push({
        controlId: row.controlId,
        framework: row.framework ?? "unknown",
        status,
        evidenceCount,
      });
    }

    const totalScore = evaluations.length === 0 ? 0
      : evaluations.reduce((sum, e) => {
        const weights: Record<string, number> = { not_started: 0, in_progress: 0.25, implemented: 0.75, verified: 1.0 };
        return sum + (weights[e.status] ?? 0);
      }, 0) / evaluations.length;

    return ok({
      status: "success",
      data: {
        evaluated: evaluations.length,
        evaluations,
        score: Math.round(totalScore * 100),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/policies/coverage/:framework — compliance coverage for a specific framework
  const coverageFrameworkMatch = path.match(/^\/api\/v1\/policies\/coverage\/([^/]+)$/);
  if (coverageFrameworkMatch && method === "GET") {
    let framework: string;
    try {
      framework = decodeURIComponent(coverageFrameworkMatch[1]).trim();
    } catch {
      return fail(400, "Invalid framework", "VALIDATION_FAILED");
    }

    const rows = await pool.query(
      `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
       FROM compliance_evidence WHERE tenant_id = $1 AND framework = $2
       GROUP BY control_id, framework ORDER BY control_id`,
      [tenantId, framework],
    );

    return ok({
      status: "success",
      data: {
        framework,
        controls: rows.rows,
        total: rows.rows.length,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return fail(404, "Not Found", "NOT_FOUND");
}

/** Parse control reference like "SOC2-CC6.1" into framework and controlId */
function parseControlRef(ref: string): { framework: string; controlId: string } {
  // Handle multi-segment prefixes like ISO-27001, NIST-CSF
  const multiSegmentPrefixes = ["ISO-27001", "NIST-CSF", "NIST-800-53"];
  for (const prefix of multiSegmentPrefixes) {
    if (ref.startsWith(prefix + "-")) {
      return { framework: prefix, controlId: ref.slice(prefix.length + 1) };
    }
  }
  // Default: split on first hyphen
  const idx = ref.indexOf("-");
  if (idx === -1) return { framework: "unknown", controlId: ref };
  return { framework: ref.slice(0, idx), controlId: ref.slice(idx + 1) };
}

/** Build a compliance snapshot for the tenant from PostgreSQL. */
async function buildComplianceSnapshot(tenantId: string, pool: pg.Pool): Promise<Record<string, unknown>> {
  const rows = await pool.query(
    `SELECT framework, control_id as "controlId", COUNT(*) as evidence_count
     FROM compliance_evidence WHERE tenant_id = $1
     GROUP BY framework, control_id`,
    [tenantId],
  );

  const frameworkMap: Record<string, { controls: number; withEvidence: number; score: number }> = {};

  for (const row of rows.rows) {
    const fw = row.framework ?? "unknown";
    if (!frameworkMap[fw]) frameworkMap[fw] = { controls: 0, withEvidence: 0, score: 0 };
    frameworkMap[fw].controls++;
    if (parseInt(row.evidence_count, 10) > 0) frameworkMap[fw].withEvidence++;
  }

  for (const fw of Object.keys(frameworkMap)) {
    const { controls, withEvidence } = frameworkMap[fw];
    frameworkMap[fw].score = controls > 0 ? Math.round((withEvidence / controls) * 100) : 0;
  }

  const overallControls = rows.rows.length;
  const overallWithEvidence = rows.rows.filter((r) => parseInt(r.evidence_count, 10) > 0).length;

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    overallScore: overallControls > 0 ? Math.round((overallWithEvidence / overallControls) * 100) : 0,
    frameworks: frameworkMap,
  };
}
