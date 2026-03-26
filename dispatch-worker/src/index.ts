// AtlasIT Dispatch Worker
// Routes multi-tenant extension requests to per-tenant workers via HTTP fetch.
// No Workers for Platforms dependency — uses worker_url from D1.

interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
  all?(): Promise<{ results?: unknown[] }>;
}
interface D1 {
  prepare(q: string): D1Stmt;
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    opts?: Record<string, unknown>,
  ): Promise<void>;
}
interface ExecutionContext {
  waitUntil(p: Promise<unknown>): void;
}

interface Env {
  ATLASIT_DB?: D1;
  TENANT_CACHE?: KVNamespace;
  LOG_LEVEL?: string;
  DISPATCH_ADMIN_TOKEN?: string;
}

interface InvocationLog {
  scriptId: string;
  tenantId: string;
  ms: number;
  status: number;
  ok: boolean;
  ts: string;
}

async function logInvocation(env: Env, log: InvocationLog) {
  if (!env.ATLASIT_DB) return;
  try {
    await env.ATLASIT_DB.prepare(
      `INSERT INTO tenant_invocations (script_id, tenant_id, ts, duration_ms, status_code, ok) VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        log.scriptId,
        log.tenantId,
        log.ts,
        log.ms,
        log.status,
        log.ok ? 1 : 0,
      )
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(
      JSON.stringify({
        level: "error",
        event: "invocation.log.fail",
        error: msg,
      }),
    );
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function jsonError(message: string, status = 400) {
  return json({ ok: false, error: message }, status);
}

function computeScriptId(tenantId: string, scriptName: string) {
  const safeTenant = tenantId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const safeScript = scriptName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return `t_${safeTenant}_${safeScript}`;
}

import { verifyAuth } from "./auth";

interface ScriptRow {
  script_id: string;
  tenant_id: string;
  script_name: string;
  worker_url: string | null;
  breaker_open_until_utc: string | null;
  failure_count_window: number;
  window_start_utc: string | null;
}

async function handleAdmin(req: Request, env: Env): Promise<Response> {
  if (!env.DISPATCH_ADMIN_TOKEN)
    return json({ ok: false, error: "admin_not_configured" }, 503);
  const provided = req.headers.get("x-admin-token") || "";
  if (provided !== env.DISPATCH_ADMIN_TOKEN)
    return json({ ok: false, error: "forbidden" }, 403);
  if (!env.ATLASIT_DB) return json({ ok: false, error: "db_unavailable" }, 500);

  const url = new URL(req.url);

  if (url.pathname === "/admin/tenant-keys" && req.method === "POST") {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const rawTenant = String(body.tenantId || "")
        .trim()
        .toLowerCase();
      if (!/^[a-z0-9_-]+$/.test(rawTenant))
        return json({ ok: false, error: "invalid_tenant" }, 400);
      const dailyQuota = Number(body.dailyQuota || 5000);
      const rawKey = crypto.randomUUID().replace(/-/g, "");
      const mod = await import("./auth");
      await mod.bootstrapApiKey(env, rawTenant, rawKey, dailyQuota);
      return json({
        ok: true,
        tenantId: rawTenant,
        apiKey: rawKey,
        dailyQuota,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "bad_request";
      return json({ ok: false, error: msg }, 400);
    }
  }

  if (url.pathname === "/admin/tenant-keys" && req.method === "GET") {
    const stmt = await env.ATLASIT_DB.prepare(
      `SELECT tenant_id, daily_quota, remaining_today FROM tenant_api_keys`,
    );
    const rows = (await stmt.all?.())?.results || [];
    return json({ ok: true, rows });
  }

  if (url.pathname === "/admin/tenant-scripts" && req.method === "POST") {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const tenantId = String(body.tenantId || "")
        .trim()
        .toLowerCase();
      const scriptName = String(body.scriptName || "").trim();
      const version = String(body.version || "").trim();
      const workerUrl = String(body.workerUrl || "").trim();
      if (!tenantId || !scriptName)
        return json({ ok: false, error: "missing_fields" }, 400);
      if (!workerUrl)
        return json({ ok: false, error: "worker_url_required" }, 400);

      const scriptId = computeScriptId(tenantId, scriptName);
      await env.ATLASIT_DB.prepare(
        `INSERT INTO tenant_scripts (script_id, tenant_id, script_name, worker_url)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(script_id) DO UPDATE SET worker_url = excluded.worker_url`,
      )
        .bind(scriptId, tenantId, scriptName, workerUrl)
        .run();

      if (version) {
        await env.ATLASIT_DB.prepare(
          `INSERT OR IGNORE INTO tenant_script_versions (script_id, version) VALUES (?, ?)`,
        )
          .bind(scriptId, version)
          .run();
      }

      const row = await env.ATLASIT_DB.prepare(
        `SELECT script_id, tenant_id, script_name, worker_url, failure_count_window, window_start_utc, breaker_open_until_utc FROM tenant_scripts WHERE script_id = ?`,
      )
        .bind(scriptId)
        .first<ScriptRow>();
      return json({ ok: true, script: row, version: version || null });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "bad_request";
      return json({ ok: false, error: msg }, 400);
    }
  }

  if (url.pathname === "/admin/tenant-scripts" && req.method === "GET") {
    const tenantFilter = url.searchParams.get("tenantId");
    const q = tenantFilter
      ? `SELECT script_id, tenant_id, script_name, worker_url, breaker_open_until_utc FROM tenant_scripts WHERE tenant_id = ?`
      : `SELECT script_id, tenant_id, script_name, worker_url, breaker_open_until_utc FROM tenant_scripts`;
    const stmt = tenantFilter
      ? env.ATLASIT_DB.prepare(q).bind(tenantFilter)
      : env.ATLASIT_DB.prepare(q);
    const rows = (await stmt.all?.())?.results || [];
    return json({ ok: true, rows });
  }

  if (url.pathname === "/admin/usage/summary" && req.method === "GET") {
    const hours = Math.min(
      Math.max(parseInt(url.searchParams.get("windowHours") || "24", 10), 1),
      168,
    );
    const sinceIso = new Date(Date.now() - hours * 3600_000).toISOString();
    const agg = await env.ATLASIT_DB.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN ok=0 THEN 1 ELSE 0 END) as failures, COUNT(DISTINCT tenant_id) as tenants FROM tenant_invocations WHERE ts >= ?`,
    )
      .bind(sinceIso)
      .first<{ total: number; failures: number; tenants: number }>();
    const topStmt = await env.ATLASIT_DB.prepare(
      `SELECT script_id, COUNT(*) c, SUM(CASE WHEN ok=0 THEN 1 ELSE 0 END) failures FROM tenant_invocations WHERE ts >= ? GROUP BY script_id ORDER BY c DESC LIMIT 10`,
    ).bind(sinceIso);
    const top = (await topStmt.all?.())?.results || [];
    const failureRate = agg?.total ? (agg.failures || 0) / agg.total : 0;
    return json({
      ok: true,
      windowHours: hours,
      total: agg?.total || 0,
      failures: agg?.failures || 0,
      failureRate,
      tenants: agg?.tenants || 0,
      topScripts: top,
    });
  }

  return json({ ok: false, error: "not_found" }, 404);
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(req.url);

    if (url.pathname === "/__health" || url.pathname === "/health")
      return json({
        ok: true,
        service: "atlasit-dispatch",
        ts: new Date().toISOString(),
      });

    if (url.pathname.startsWith("/admin/")) {
      return handleAdmin(req, env);
    }

    if (url.pathname.startsWith("/ext/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const [, tenantId, scriptName, ...rest] = parts;
      if (!tenantId || !scriptName)
        return jsonError("Missing tenant or script", 400);

      const authResult = await verifyAuth(
        env,
        req.headers.get("authorization"),
      );
      if (!authResult.ok) {
        const code = authResult.reason === "quota_exhausted" ? 429 : 401;
        return json(
          { ok: false, error: "unauthorized", reason: authResult.reason },
          code,
        );
      }
      if (authResult.tenantId !== tenantId)
        return json({ ok: false, error: "tenant_mismatch" }, 403);

      const scriptId = computeScriptId(tenantId, scriptName);
      const scriptRow = await env.ATLASIT_DB?.prepare(
        `SELECT worker_url, breaker_open_until_utc FROM tenant_scripts WHERE script_id = ?`,
      )
        .bind(scriptId)
        .first<ScriptRow>();

      if (!scriptRow)
        return json({ ok: false, error: "unregistered_script" }, 404);
      if (!scriptRow.worker_url)
        return json({ ok: false, error: "no_worker_url_configured" }, 404);

      if (
        scriptRow.breaker_open_until_utc &&
        scriptRow.breaker_open_until_utc > new Date().toISOString()
      ) {
        return new Response(
          JSON.stringify({ ok: false, error: "circuit_open" }),
          {
            status: 503,
            headers: {
              "content-type": "application/json",
              "retry-after": "60",
            },
          },
        );
      }

      // Route to the tenant's worker via HTTP fetch
      const targetPath = "/" + rest.join("/");
      const targetUrl = new URL(targetPath, scriptRow.worker_url);
      const start = Date.now();

      try {
        const forwarded = new Request(targetUrl.toString(), {
          method: req.method,
          headers: new Headers(req.headers),
          body:
            req.method === "GET" || req.method === "HEAD"
              ? undefined
              : await req.arrayBuffer(),
        });
        forwarded.headers.set("x-atlas-tenant", tenantId);
        forwarded.headers.set("x-atlas-script", scriptId);
        forwarded.headers.set("x-atlas-dispatch-ts", new Date().toISOString());
        forwarded.headers.set("x-atlas-auth-tenant", authResult.tenantId || "");

        const resp = await fetch(forwarded);
        ctx.waitUntil(
          logInvocation(env, {
            scriptId,
            tenantId,
            ms: Date.now() - start,
            status: resp.status,
            ok: resp.ok,
            ts: new Date().toISOString(),
          }),
        );
        ctx.waitUntil(updateCircuit(env, scriptId, resp.ok, resp.status));
        return resp;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(
          JSON.stringify({
            level: "error",
            event: "dispatch.invoke.fail",
            scriptId,
            tenantId,
            error: msg,
          }),
        );
        ctx.waitUntil(
          logInvocation(env, {
            scriptId,
            tenantId,
            ms: Date.now() - start,
            status: 502,
            ok: false,
            ts: new Date().toISOString(),
          }),
        );
        ctx.waitUntil(updateCircuit(env, scriptId, false, 502));
        return jsonError("Upstream worker unreachable", 502);
      }
    }

    if (url.pathname === "/" || url.pathname === "/docs") {
      return json({
        ok: true,
        service: "atlasit-dispatch",
        routes: {
          ext: "/ext/:tenant/:script/*",
          health: "/__health",
          adminUsage: "/admin/usage/summary",
        },
      });
    }

    return jsonError("Not found", 404);
  },
};

async function updateCircuit(
  env: Env,
  scriptId: string,
  success: boolean,
  statusCode: number,
) {
  if (!env.ATLASIT_DB) return;
  try {
    const nowIso = new Date().toISOString();
    const row = await env.ATLASIT_DB.prepare(
      `SELECT failure_count_window, window_start_utc, breaker_open_until_utc FROM tenant_scripts WHERE script_id = ?`,
    )
      .bind(scriptId)
      .first<ScriptRow>();
    if (!row) return;

    if (row.breaker_open_until_utc && row.breaker_open_until_utc > nowIso)
      return;

    const windowMinutes = 5;
    const openThreshold = 5;
    const cooldownMinutes = 2;

    let count = row.failure_count_window || 0;
    let windowStart = row.window_start_utc;

    if (
      !windowStart ||
      Date.parse(nowIso) - Date.parse(windowStart) > windowMinutes * 60_000
    ) {
      count = 0;
      windowStart = nowIso;
    }

    const isFailure = !success || statusCode >= 500;
    if (isFailure) count += 1;
    else if (count > 0) count = Math.max(0, count - 1);

    let breakerUntil: string | null = null;
    if (count >= openThreshold) {
      breakerUntil = new Date(
        Date.now() + cooldownMinutes * 60_000,
      ).toISOString();
      count = 0;
    }

    await env.ATLASIT_DB.prepare(
      `UPDATE tenant_scripts SET failure_count_window = ?, window_start_utc = ?, breaker_open_until_utc = COALESCE(?, breaker_open_until_utc) WHERE script_id = ?`,
    )
      .bind(count, windowStart, breakerUntil, scriptId)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(
      JSON.stringify({
        level: "error",
        event: "circuit.update.fail",
        scriptId,
        error: msg,
      }),
    );
  }
}
