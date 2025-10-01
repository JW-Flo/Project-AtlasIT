import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { executeWorkflow, getExecution } from "./modules/automation/service";
import type { WorkflowType } from "./modules/automation/templates";
import type { WorkflowExecutionRecord } from "./modules/automation/store";
import { requireTenant, AuthError } from "./modules/auth";
import {
  ensurePolicyInfrastructure,
  listTemplates as listPolicyTemplates,
  generatePolicyDocument,
  evaluatePolicyInput,
  coverageSummary,
  recordEvidenceControlLink,
} from "./modules/policies/service";
import {
  ComplianceSnapshot,
  EvidenceIngestRequest,
  deriveRiskScore,
  deriveSeverity,
} from "./types";
import { drainCounters, hasCounters, incrementCounter } from "./metrics";

interface Env {
  D1_COMPLIANCE?: D1Database;
  atlasit_compliance?: D1Database;
  EVIDENCE_BUCKET?: R2Bucket;
  atlasit_evidence?: R2Bucket;
  BUILD_VERSION?: string;
  API_TOKENS?: KVNamespace;
  api_tokens?: KVNamespace;
  apiTokens?: KVNamespace;
}

const SNAPSHOT_TTL_SECONDS = 300;
const DEFAULT_TENANT = "demo";
const DEFAULT_PACK = "unspecified";
const DEFAULT_SUBJECT = "unknown";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const WORKFLOW_TYPES: WorkflowType[] = ["joiner", "mover", "leaver"];

interface AutomationResponseStep {
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

interface AutomationResponseBody {
  execution: {
    id: string;
    tenantId: string;
    type: WorkflowType;
    subjectRef: string | null;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    durationMs: number;
    steps: AutomationResponseStep[];
  };
  meta: {
    idempotentHit: boolean;
  };
}

function mapExecutionToResponse(
  execution: WorkflowExecutionRecord,
  idempotentHit: boolean,
): AutomationResponseBody {
  const steps: AutomationResponseStep[] = execution.steps.map((step) => ({
    stepId: step.stepId,
    action: step.action,
    status: step.status,
    attempts: step.attempts,
    output: step.output,
    error: step.error ?? null,
    startedAt: step.startedAt,
    completedAt: step.completedAt,
    durationMs: step.durationMs,
  }));

  return {
    execution: {
      id: execution.id,
      tenantId: execution.tenantId,
      type: execution.workflowType,
      subjectRef: execution.subjectRef ?? null,
      status: execution.status,
      createdAt: execution.createdAt,
      completedAt: execution.completedAt ?? null,
      durationMs: execution.durationMs,
      steps,
    },
    meta: {
      idempotentHit,
    },
  };
}

async function handlePolicyTemplates(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  try {
    await ensurePolicyInfrastructure(db);
    const templates = await listPolicyTemplates(db);
    const body = {
      templates: templates.map((tpl) => ({
        key: tpl.key,
        name: tpl.name,
        format: tpl.format,
      })),
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "policy.templates.error", {
      requestId,
      tenantId: tenant.tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to list policy templates",
    );
  }
}

async function persistPolicyToR2(
  bucket: R2Bucket,
  record: {
    hash: string;
    content: string;
    tenantId: string;
    templateKey: string;
    contextHash: string;
    reused: boolean;
  },
) {
  const key = `policies/${record.hash}.md`;
  if (record.reused) {
    const head = await bucket.head(key);
    if (head) return key;
  }
  await bucket.put(key, record.content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      tenantId: record.tenantId,
      templateKey: record.templateKey,
      contextHash: record.contextHash,
    },
  });
  return key;
}

async function handlePolicyGenerate(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const bucket = resolveR2(env);
  if (!bucket) {
    return errorResponse(501, requestId, headers, "Policy storage unavailable");
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const templateKey =
    typeof body?.templateKey === "string" ? body.templateKey : undefined;
  if (!templateKey) {
    return errorResponse(400, requestId, headers, "templateKey is required");
  }
  const input = body?.input && typeof body.input === "object" ? body.input : {};

  try {
    const result = await generatePolicyDocument({
      db,
      tenantId: tenant.tenantId,
      templateKey,
      input,
    });

    await persistPolicyToR2(bucket, {
      hash: result.hash,
      content: result.content,
      tenantId: tenant.tenantId,
      templateKey,
      contextHash: result.contextHash,
      reused: result.reused,
    });

    const responseBody = {
      hash: result.hash,
      contextHash: result.contextHash,
      content: result.content,
      templateKey,
      reused: result.reused,
      createdAt: result.createdAt,
      sizeBytes: result.sizeBytes,
    };

    log("info", "policy.generate", {
      requestId,
      tenantId: tenant.tenantId,
      templateKey,
      hash: result.hash,
      reused: result.reused,
    });

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "policy.generate.error", {
      requestId,
      tenantId: tenant.tenantId,
      templateKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to generate policy");
  }
}

async function handlePolicyEvaluate(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const policyKey =
    typeof body?.policyKey === "string" ? body.policyKey : undefined;
  if (!policyKey) {
    return errorResponse(400, requestId, headers, "policyKey is required");
  }
  const input = body?.input && typeof body.input === "object" ? body.input : {};

  try {
    const result = await evaluatePolicyInput({
      db,
      tenantId: tenant.tenantId,
      policyKey,
      input,
    });
    return new Response(
      JSON.stringify({
        hash: result.hash,
        result: result.result,
        meta: { deterministic: true },
      }),
      {
        status: 200,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  } catch (err) {
    log("error", "policy.evaluate.error", {
      requestId,
      tenantId: tenant.tenantId,
      policyKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to evaluate policy");
  }
}

async function handlePolicyCoverage(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["policies:manage"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Policy store unavailable");
  }

  const url = new URL(request.url);
  const framework = url.searchParams.get("framework") || "SOC2";

  try {
    const summary = await coverageSummary(db, framework, tenant.tenantId);
    return new Response(JSON.stringify({ framework, ...summary }), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "policy.coverage.error", {
      requestId,
      tenantId: tenant.tenantId,
      framework,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to load policy coverage",
    );
  }
}

async function handleWorkflowExecute(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
      ["automation:execute"],
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(
      503,
      requestId,
      headers,
      "Automation store unavailable",
    );
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }

  const workflowType = payload?.type as WorkflowType | undefined;
  if (!workflowType || !WORKFLOW_TYPES.includes(workflowType)) {
    return errorResponse(400, requestId, headers, "Unsupported workflow type");
  }

  const subjectRef =
    typeof payload?.subjectRef === "string" && payload.subjectRef.trim()
      ? payload.subjectRef.trim()
      : undefined;
  if (!subjectRef) {
    return errorResponse(400, requestId, headers, "subjectRef is required");
  }

  const headerIdempotency = request.headers.get("Idempotency-Key") || undefined;
  const bodyIdempotency =
    typeof payload.idempotencyKey === "string"
      ? payload.idempotencyKey
      : undefined;
  const idempotencyKey = headerIdempotency || bodyIdempotency;

  try {
    const { execution, idempotentHit } = await executeWorkflow({
      db,
      tenantId: tenant.tenantId,
      workflowType,
      subjectRef,
      idempotencyKey,
      overrides: payload?.overrides,
    });

    log("info", "automation.execution.completed", {
      requestId,
      tenantId: tenant.tenantId,
      workflowType,
      executionId: execution.id,
      idempotent: idempotentHit,
    });

    const responseBody = mapExecutionToResponse(execution, idempotentHit);
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "automation.execution.error", {
      requestId,
      tenantId: tenant.tenantId,
      workflowType,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to execute workflow");
  }
}

async function handleWorkflowGet(
  request: Request,
  env: Env,
  executionId: string,
  requestId: string,
  headers: Record<string, string>,
) {
  let tenant: Awaited<ReturnType<typeof requireTenant>>;
  try {
    tenant = await requireTenant(
      request,
      env as unknown as Record<string, unknown>,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.status, requestId, headers, err.message);
    }
    throw err;
  }

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(
      503,
      requestId,
      headers,
      "Automation store unavailable",
    );
  }

  try {
    const execution = await getExecution(db, tenant.tenantId, executionId);
    if (!execution) {
      return errorResponse(404, requestId, headers, "Execution not found");
    }
    const body = mapExecutionToResponse(execution, false);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    });
  } catch (err) {
    log("error", "automation.execution.read_error", {
      requestId,
      executionId,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, requestId, headers, "Failed to load execution");
  }
}

function resolveD1(env: Env): D1Database | undefined {
  return env.D1_COMPLIANCE || env.atlasit_compliance;
}

function resolveR2(env: Env): R2Bucket | undefined {
  return env.EVIDENCE_BUCKET || env.atlasit_evidence;
}

function log(level: string, event: string, data: Record<string, unknown> = {}) {
  const base = {
    ts: new Date().toISOString(),
    level,
    event,
    worker: "compliance",
    ...data,
  };
  console.log(JSON.stringify(base));
}

function buildSnapshot(tenantId: string): ComplianceSnapshot {
  const now = new Date();
  const risksBase = [
    {
      id: "R1",
      title: "Unpatched server infrastructure",
      likelihood: 4,
      impact: 4,
      owner: "ops@tenant",
    },
    { id: "R2", title: "MFA coverage gaps", likelihood: 3, impact: 3 },
    {
      id: "R3",
      title: "Third-party vendor exposure",
      likelihood: 5,
      impact: 4,
      owner: "security@tenant",
    },
  ].map((r) => {
    const score = deriveRiskScore(r.likelihood, r.impact);
    const severity = deriveSeverity(score);
    return { ...r, score, severity };
  });
  return {
    tenantId,
    generatedAt: now.toISOString(),
    frameworkSummary: [
      {
        framework: "SOC2",
        coveragePercent: 52,
        passing: 120,
        failing: 30,
        total: 200,
      },
      {
        framework: "ISO27001",
        coveragePercent: 41,
        passing: 80,
        failing: 40,
        total: 160,
      },
    ],
    risks: risksBase,
    policies: [
      {
        id: "P1",
        name: "Access Control Policy",
        status: "approved",
        updated: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "P2",
        name: "Incident Response Plan",
        status: "draft",
        updated: now.toISOString(),
      },
    ],
  };
}

async function ensureSchema(env: Env) {
  const db = resolveD1(env);
  if (!db) return;
  try {
    await db.exec(`CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL UNIQUE,
      generated_at TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await db.exec(`CREATE TABLE IF NOT EXISTS evidence_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      tenant_id TEXT NOT NULL,
      pack TEXT NOT NULL,
      subject_ref TEXT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await db.exec(
      "CREATE INDEX IF NOT EXISTS idx_evidence_tenant_created ON evidence_index (tenant_id, created_at DESC);",
    );
    await db.exec(
      "CREATE INDEX IF NOT EXISTS idx_evidence_pack_created ON evidence_index (pack, created_at DESC);",
    );
  } catch (e) {
    log("error", "schema.ensure.error", { error: (e as Error).message });
  }
}

async function getPersistedSnapshot(
  env: Env,
  tenantId: string,
  maxAgeSeconds: number,
): Promise<ComplianceSnapshot | null> {
  const db = resolveD1(env);
  if (!db) return null;
  try {
    const row = await db
      .prepare(
        "SELECT payload, generated_at FROM snapshots WHERE tenant_id = ? LIMIT 1",
      )
      .bind(tenantId)
      .first<Record<string, string>>();
    if (!row) return null;
    const parsed: ComplianceSnapshot = JSON.parse(row.payload);
    const reference = row.generated_at || parsed.generatedAt;
    const ageSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(reference).getTime()) / 1000),
    );
    if (ageSeconds > maxAgeSeconds) return null;
    return { ...parsed, ageSeconds };
  } catch (e) {
    log("error", "snapshot.read.error", { error: (e as Error).message });
    return null;
  }
}

async function persistSnapshot(
  env: Env,
  tenantId: string,
  snapshot: ComplianceSnapshot,
) {
  const db = resolveD1(env);
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO snapshots (tenant_id, generated_at, payload)
        VALUES (?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET
          generated_at = excluded.generated_at,
          payload = excluded.payload,
          created_at = CURRENT_TIMESTAMP`,
      )
      .bind(tenantId, snapshot.generatedAt, JSON.stringify(snapshot))
      .run();
  } catch (e) {
    log("error", "snapshot.write.error", { error: (e as Error).message });
  }
}

function buildCors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
  };
}

function mergeHeaders(
  base: Record<string, string>,
  additions: Record<string, string>,
): Record<string, string> {
  return { ...base, ...additions };
}

type HealthPayload = {
  status: string;
  service: string;
  timestamp: number;
  version: string;
  buildVersion: string;
  snapshotAgeSeconds?: number;
  d1: boolean;
  r2: boolean;
  evidenceCount: number;
  aiQuotaUsed?: number | null;
  aiQuotaRemaining?: number | null;
};

async function handleHealth(
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  const db = resolveD1(env);
  let latestAge: number | undefined;
  let evidenceCount = 0;

  if (db) {
    try {
      const latestSnapshot = await db
        .prepare(
          "SELECT generated_at FROM snapshots ORDER BY generated_at DESC LIMIT 1",
        )
        .first<Record<string, string>>();
      if (latestSnapshot?.generated_at) {
        latestAge = Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(latestSnapshot.generated_at).getTime()) /
              1000,
          ),
        );
      }
    } catch (e) {
      log("error", "health.snapshotAge.error", { error: (e as Error).message });
    }

    try {
      const countRow = await db
        .prepare("SELECT COUNT(*) as count FROM evidence_index")
        .first<{ count: number }>();
      evidenceCount = countRow?.count ?? 0;
    } catch (e) {
      log("error", "health.evidenceCount.error", {
        error: (e as Error).message,
      });
    }
  }

  if (hasCounters()) {
    const snapshot = drainCounters();
    if (Object.keys(snapshot).length > 0) {
      log("info", "metrics.flush", { requestId, counters: snapshot });
    }
  }

  const buildVersion = env.BUILD_VERSION || "dev";
  const body: HealthPayload = {
    status: "ok",
    service: "compliance-worker",
    timestamp: Date.now(),
    version: buildVersion,
    buildVersion,
    snapshotAgeSeconds: latestAge,
    d1: !!db,
    r2: !!resolveR2(env),
    evidenceCount,
    // Placeholder fields for orchestrator AI quota (not resolved here to avoid cross-fetch cost)
    aiQuotaUsed: null,
    aiQuotaRemaining: null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

async function handleSnapshot(
  env: Env,
  url: URL,
  requestId: string,
  headers: Record<string, string>,
  method: "GET" | "HEAD",
) {
  const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT;
  const start = Date.now();
  try {
    await ensureSchema(env);
    let snapshot = await getPersistedSnapshot(
      env,
      tenantId,
      SNAPSHOT_TTL_SECONDS,
    );
    if (snapshot) {
      log("info", "snapshot.cached", {
        requestId,
        tenantId,
        ageSeconds: snapshot.ageSeconds,
      });
      return new Response(method === "HEAD" ? null : JSON.stringify(snapshot), {
        status: 200,
        headers: mergeHeaders(headers, {
          "content-type": "application/json",
          "Cache-Control": "public, max-age=60",
        }),
      });
    }

    const fresh = buildSnapshot(tenantId);
    await persistSnapshot(env, tenantId, fresh);
    const enriched: ComplianceSnapshot = { ...fresh, ageSeconds: 0 };
    log("info", "snapshot.fresh", {
      requestId,
      tenantId,
      risks: fresh.risks.length,
    });
    return new Response(method === "HEAD" ? null : JSON.stringify(enriched), {
      status: 200,
      headers: mergeHeaders(headers, {
        "content-type": "application/json",
        "Cache-Control": "no-cache",
      }),
    });
  } catch (err) {
    log("error", "snapshot.error", {
      requestId,
      error: (err as Error).message,
    });
    return new Response(
      JSON.stringify({ error: "Internal error", requestId }),
      {
        status: 500,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  } finally {
    const dur = Date.now() - start;
    log("info", "snapshot.duration", { requestId, ms: dur });
  }
}

function errorResponse(
  status: number,
  requestId: string,
  headers: Record<string, string>,
  message: string,
) {
  return new Response(JSON.stringify({ error: message, requestId }), {
    status,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

// --- Evidence ingest helper extraction to reduce complexity ---
function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function serializePayload(
  obj: unknown,
): { serialized: string; tooLarge: boolean } | null {
  if (!obj || typeof obj !== "object") return null;
  const serialized = JSON.stringify(obj);
  return { serialized, tooLarge: false };
}

async function storeEvidenceObject(
  bucket: R2Bucket,
  hash: string,
  canonical: string,
  meta: { tenantId: string; pack: string; subject: string },
) {
  const head = await bucket.head(hash);
  if (head) return false;
  await bucket.put(hash, canonical, {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: meta,
    onlyIf: { ifNoneMatch: "*" },
  });
  return true;
}

async function indexEvidence(
  db: D1Database,
  data: {
    hash: string;
    tenantId: string;
    pack: string;
    subject: string;
    canonical: string;
  },
) {
  const result = await db
    .prepare(
      `INSERT INTO evidence_index (hash, tenant_id, pack, subject_ref, payload)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(hash) DO NOTHING`,
    )
    .bind(data.hash, data.tenantId, data.pack, data.subject, data.canonical)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

async function handleEvidenceIngest(
  request: Request,
  env: Env,
  requestId: string,
  headers: Record<string, string>,
) {
  const bucket = resolveR2(env);
  if (!bucket)
    return errorResponse(503, requestId, headers, "Evidence store unavailable");

  let body: EvidenceIngestRequest | null = null;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, requestId, headers, "Invalid JSON payload");
  }
  if (!body || typeof body !== "object" || !body.payload) {
    return errorResponse(400, requestId, headers, "Missing evidence payload");
  }
  if (typeof body.payload !== "object") {
    return errorResponse(
      400,
      requestId,
      headers,
      "Evidence payload must be object",
    );
  }

  const maxBytes = Number(env.MAX_EVIDENCE_BYTES || 51200);
  const serializedInfo = serializePayload(body.payload);
  if (!serializedInfo) {
    return errorResponse(400, requestId, headers, "Invalid evidence payload");
  }
  const { serialized } = serializedInfo;
  const payloadSize = new TextEncoder().encode(serialized).byteLength;
  if (payloadSize > maxBytes) {
    log("warn", "evidence.payload.too_large", {
      requestId,
      bytes: payloadSize,
      maxBytes,
    });
    return new Response(
      JSON.stringify({
        error: "evidence_too_large",
        maxBytes,
        requestId,
      }),
      {
        status: 413,
        headers: mergeHeaders(headers, { "content-type": "application/json" }),
      },
    );
  }

  const tenantId = normalizeString(body.tenantId, DEFAULT_TENANT);
  const pack = normalizeString(body.pack, DEFAULT_PACK);
  const subject = normalizeString(body.subject, DEFAULT_SUBJECT);

  await ensureSchema(env);
  const { canonical, hash } = await hashCanonicalJson(body.payload);

  let stored = false;
  try {
    stored = await storeEvidenceObject(bucket, hash, canonical, {
      tenantId,
      pack,
      subject,
    });
  } catch (e) {
    log("error", "evidence.write.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to persist evidence");
  }

  const db = resolveD1(env);
  if (!db)
    return errorResponse(503, requestId, headers, "Evidence index unavailable");
  let indexed = false;
  try {
    indexed = await indexEvidence(db, {
      hash,
      tenantId,
      pack,
      subject,
      canonical,
    });
  } catch (e) {
    log("error", "evidence.index.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to index evidence");
  }

  try {
    await recordEvidenceControlLink(db, pack, hash, tenantId);
  } catch (e) {
    log("warn", "evidence.control_link.error", {
      requestId,
      hash,
      pack,
      error: (e as Error).message,
    });
  }

  const isNew = stored || indexed;
  if (isNew) incrementCounter("evidence.ingest", 1);
  log("info", "evidence.ingest", {
    requestId,
    tenantId,
    pack,
    subject,
    hash,
    stored: isNew,
  });
  return new Response(JSON.stringify({ hash, stored: isNew }), {
    status: 200,
    headers: mergeHeaders(headers, { "content-type": "application/json" }),
  });
}

async function handleEvidenceGet(
  env: Env,
  hash: string,
  requestId: string,
  headers: Record<string, string>,
) {
  const bucket = resolveR2(env);
  if (!bucket) {
    return errorResponse(503, requestId, headers, "Evidence store unavailable");
  }

  try {
    const object = await bucket.get(hash);
    if (!object) {
      return errorResponse(404, requestId, headers, "Evidence not found");
    }
    const body = await object.text();
    return new Response(body, {
      status: 200,
      headers: mergeHeaders(headers, {
        "content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Evidence-Hash": hash,
      }),
    });
  } catch (e) {
    log("error", "evidence.read.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(500, requestId, headers, "Failed to read evidence");
  }
}

function parseLimit(raw: string | null): number {
  if (!raw) return 20;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(50, Math.floor(parsed));
}

async function handleEvidenceSearch(
  env: Env,
  url: URL,
  requestId: string,
  headers: Record<string, string>,
) {
  const db = resolveD1(env);
  if (!db) {
    return errorResponse(503, requestId, headers, "Evidence index unavailable");
  }

  await ensureSchema(env);

  const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;
  const pack = url.searchParams.get("pack")?.trim() || undefined;
  const subject = url.searchParams.get("subject")?.trim() || undefined;
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursorParam = url.searchParams.get("cursor");
  let cursor: number | undefined;

  if (cursorParam) {
    cursor = Number(cursorParam);
    if (!Number.isFinite(cursor) || cursor <= 0) {
      return errorResponse(400, requestId, headers, "Invalid cursor value");
    }
  }

  const conditions: string[] = [];
  const bindings: Array<string | number> = [];

  if (tenantId) {
    conditions.push("tenant_id = ?");
    bindings.push(tenantId);
  }
  if (pack) {
    conditions.push("pack = ?");
    bindings.push(pack);
  }
  if (subject) {
    conditions.push("subject_ref = ?");
    bindings.push(subject);
  }
  if (cursor) {
    conditions.push("id < ?");
    bindings.push(cursor);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const fetchLimit = limit + 1;

  const stmt = db
    .prepare(
      `SELECT id, hash, tenant_id, pack, subject_ref, created_at
       FROM evidence_index
       ${whereClause}
       ORDER BY id DESC
       LIMIT ?`,
    )
    .bind(...bindings, fetchLimit);

  let results: Array<Record<string, unknown>> = [];
  try {
    const { results: rows } = await stmt.all();
    results = rows ?? [];
  } catch (e) {
    log("error", "evidence.search.error", {
      requestId,
      error: (e as Error).message,
    });
    return errorResponse(
      500,
      requestId,
      headers,
      "Failed to query evidence index",
    );
  }

  const hasNext = results.length > limit;
  const sliced = hasNext ? results.slice(0, limit) : results;

  const items = sliced.map((row) => {
    let subjectVal: string | null = null;
    if (row.subject_ref != null) {
      if (typeof row.subject_ref === "string") subjectVal = row.subject_ref;
      else subjectVal = JSON.stringify(row.subject_ref);
    }
    return {
      id: Number(row.id),
      hash: String(row.hash),
      tenantId: String(row.tenant_id),
      pack: String(row.pack),
      subject: subjectVal,
      createdAt: String(row.created_at),
    };
  });

  const nextCursor = hasNext ? String(sliced[sliced.length - 1].id) : null;

  return new Response(
    JSON.stringify({
      items,
      nextCursor,
      count: items.length,
    }),
    {
      status: 200,
      headers: mergeHeaders(headers, { "content-type": "application/json" }),
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const cors = buildCors();
    const headers = mergeHeaders(cors, SECURITY_HEADERS);
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/health" && method === "GET") {
      return handleHealth(env, requestId, headers);
    }

    if (url.pathname === "/api/v1/workflows/execute" && method === "POST") {
      return handleWorkflowExecute(request, env, requestId, headers);
    }

    if (
      url.pathname.startsWith("/api/v1/workflows/executions/") &&
      method === "GET"
    ) {
      const executionId = url.pathname.split("/").pop();
      if (!executionId) {
        return errorResponse(
          400,
          requestId,
          headers,
          "Missing execution identifier",
        );
      }
      return handleWorkflowGet(request, env, executionId, requestId, headers);
    }

    if (url.pathname === "/api/v1/policies/templates" && method === "GET") {
      return handlePolicyTemplates(request, env, requestId, headers);
    }

    if (url.pathname === "/api/v1/policies/generate" && method === "POST") {
      return handlePolicyGenerate(request, env, requestId, headers);
    }

    if (url.pathname === "/api/v1/policy/evaluate" && method === "POST") {
      return handlePolicyEvaluate(request, env, requestId, headers);
    }

    if (url.pathname === "/api/v1/policies/coverage" && method === "GET") {
      return handlePolicyCoverage(request, env, requestId, headers);
    }

    if (
      url.pathname === "/api/compliance/snapshot" &&
      (method === "GET" || method === "HEAD")
    ) {
      return handleSnapshot(
        env,
        url,
        requestId,
        headers,
        method === "HEAD" ? "HEAD" : "GET",
      );
    }

    if (url.pathname === "/api/evidence/ingest" && method === "POST") {
      return handleEvidenceIngest(request, env, requestId, headers);
    }

    if (url.pathname === "/api/evidence/search" && method === "GET") {
      return handleEvidenceSearch(env, url, requestId, headers);
    }

    if (url.pathname.startsWith("/api/evidence/") && method === "GET") {
      const hash = url.pathname.split("/").pop();
      if (!hash) {
        return errorResponse(400, requestId, headers, "Missing evidence hash");
      }
      return handleEvidenceGet(env, hash, requestId, headers);
    }

    return errorResponse(404, requestId, headers, "Not Found");
  },
};
