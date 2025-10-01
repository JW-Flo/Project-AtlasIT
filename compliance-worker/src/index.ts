import { ComplianceSnapshot, deriveRiskScore, deriveSeverity } from "./types";
// Export a noop to ensure module is recognized by TypeScript project references
export const __complianceWorker = true;

interface Env {
  D1_COMPLIANCE?: D1Database;
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

async function getPersistedSnapshot(
  env: Env,
  tenantId: string,
  maxAgeSeconds: number,
): Promise<ComplianceSnapshot | null> {
  if (!env.D1_COMPLIANCE) return null;
  try {
    const stmt = env.D1_COMPLIANCE.prepare(
      "SELECT data, generated_at FROM snapshots WHERE tenant_id = ? LIMIT 1",
    ).bind(tenantId);
    const row: any = await stmt.first();
    if (!row) return null;
    const parsed: ComplianceSnapshot = JSON.parse(row.data);
    const ageSeconds = Math.floor(
      (Date.now() - new Date(row.generated_at).getTime()) / 1000,
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
  if (!env.D1_COMPLIANCE) return;
  try {
    await env.D1_COMPLIANCE.prepare(
      "INSERT OR REPLACE INTO snapshots (tenant_id, generated_at, data) VALUES (?, ?, ?)",
    )
      .bind(tenantId, snapshot.generatedAt, JSON.stringify(snapshot))
      .run();
  } catch (e) {
    log("error", "snapshot.write.error", { error: (e as Error).message });
  }
}

async function ensureSchema(env: Env) {
  if (!env.D1_COMPLIANCE) return;
  // Simple lazy schema init (idempotent)
  try {
    await env.D1_COMPLIANCE.exec(`CREATE TABLE IF NOT EXISTS snapshots (
      tenant_id TEXT PRIMARY KEY,
      generated_at TEXT NOT NULL,
      data TEXT NOT NULL
    );`);
  } catch (e) {
    log("error", "schema.ensure.error", { error: (e as Error).message });
  }
}

function buildCors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
  };
}

async function handleHealth(
  env: Env,
  requestId: string,
  cors: Record<string, string>,
) {
  let latestAge: number | undefined;
  if (env.D1_COMPLIANCE) {
    try {
      const row: any = await env.D1_COMPLIANCE.prepare(
        "SELECT generated_at FROM snapshots ORDER BY generated_at DESC LIMIT 1",
      ).first();
      if (row?.generated_at) {
        latestAge = Math.floor(
          (Date.now() - new Date(row.generated_at).getTime()) / 1000,
        );
      }
    } catch (e) {
      log("error", "health.snapshotAge.error", { error: (e as Error).message });
    }
  }
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "compliance-worker",
      timestamp: Date.now(),
      version: "1.0.1",
      snapshotAgeSeconds: latestAge,
      d1: !!env.D1_COMPLIANCE,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "X-Request-ID": requestId,
        ...cors,
      },
    },
  );
}

async function handleSnapshot(
  env: Env,
  url: URL,
  requestId: string,
  cors: Record<string, string>,
) {
  const tenantId = url.searchParams.get("tenantId") || "tenant_default";
  const start = Date.now();
  try {
    await ensureSchema(env);
    let snapshot = await getPersistedSnapshot(env, tenantId, 300);
    if (snapshot) {
      log("info", "snapshot.cached", {
        requestId,
        tenantId,
        ageSeconds: snapshot.ageSeconds,
      });
      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "Cache-Control": "public, max-age=60",
          "X-Request-ID": requestId,
          ...cors,
        },
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
    return new Response(JSON.stringify(enriched), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "no-cache",
        "X-Request-ID": requestId,
        ...cors,
      },
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
        headers: {
          "content-type": "application/json",
          "X-Request-ID": requestId,
          ...cors,
        },
      },
    );
  } finally {
    const dur = Date.now() - start;
    log("info", "snapshot.duration", { requestId, ms: dur });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const cors = buildCors();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/health") return handleHealth(env, requestId, cors);
    if (url.pathname === "/api/compliance/snapshot" && request.method === "GET")
      return handleSnapshot(env, url, requestId, cors);
    return new Response(JSON.stringify({ error: "Not Found", requestId }), {
      status: 404,
      headers: {
        "content-type": "application/json",
        "X-Request-ID": requestId,
        ...cors,
      },
    });
  },
};
