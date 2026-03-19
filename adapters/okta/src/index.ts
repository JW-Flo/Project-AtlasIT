import { Hono } from "hono";
import type { Bindings, SyncResult } from "./types.js";
import { syncDirectory } from "./sync.js";
import { handleVerification, handleEventHook } from "./webhooks.js";
import { scimRouter } from "./scim/router.js";

const app = new Hono<{ Bindings: Bindings }>();

// Mount SCIM 2.0 provisioning endpoints
app.route("/scim/v2", scimRouter);

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    service: "okta-connector",
    connectorId: c.env.CONNECTOR_ID,
  });
});

app.post("/api/sync", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c.req.json<{ orgUrl: string }>().catch(() => null);
  if (!body?.orgUrl) {
    return c.json({ error: "Missing orgUrl in request body" }, 400);
  }

  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting directory sync",
      orgUrl: body.orgUrl,
    }),
  );

  try {
    const result: SyncResult = await syncDirectory(
      c.env.DB,
      body.orgUrl,
      c.env.OKTA_API_TOKEN,
      tenantId,
    );

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "Directory sync completed",
        users: result.users,
        groups: result.groups,
      }),
    );

    return c.json({ status: "synced", correlationId, data: result });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Directory sync failed",
        error: errorMsg,
      }),
    );
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

app.get("/api/status", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const connection = await c.env.DB.prepare(
    "SELECT status, error_msg, last_sync_at, user_count, group_count FROM directory_connections WHERE tenant_id = ?1",
  )
    .bind(tenantId)
    .first<{
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
    }>();

  if (!connection) {
    return c.json({
      status: "not_connected",
      lastSyncAt: null,
      userCount: 0,
      groupCount: 0,
    });
  }

  return c.json({
    status: connection.status,
    error: connection.error_msg,
    lastSyncAt: connection.last_sync_at,
    userCount: connection.user_count,
    groupCount: connection.group_count,
  });
});

app.get("/webhooks/okta/events", (c) => handleVerification(c));

app.post("/webhooks/okta/events", (c) => handleEventHook(c));

// ── Adapter evidence collection ──────────────────────────────────────────────

type EvidenceStatus = "pass" | "fail" | "unknown";

interface AdapterEvidenceItem {
  type: string;
  controlRefs: string[];
  status: EvidenceStatus;
  details: Record<string, unknown>;
}

async function fetchOktaPolicies(
  orgUrl: string,
  token: string,
  type: string,
): Promise<Array<Record<string, unknown>> | null> {
  try {
    const res = await fetch(`${orgUrl}/api/v1/policies?type=${type}`, {
      headers: {
        Authorization: `SSWS ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch {
    return null;
  }
}

function evaluateMfaPolicy(
  policies: Array<Record<string, unknown>> | null,
): AdapterEvidenceItem {
  const controlRefs = ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"];

  if (policies === null) {
    return { type: "mfa_policy", controlRefs, status: "unknown", details: { error: "Failed to fetch MFA policies" } };
  }

  const active = policies.filter((p) => p.status === "ACTIVE");
  if (active.length === 0) {
    return { type: "mfa_policy", controlRefs, status: "fail", details: { reason: "No active MFA enrollment policy found" } };
  }

  const hasRequired = active.some((p) => {
    const factors = (p.settings as Record<string, unknown> | undefined)?.factors as
      | Record<string, Record<string, Record<string, string>>>
      | undefined;
    if (!factors) return false;
    return Object.values(factors).some((f) => f?.enroll?.self === "REQUIRED");
  });

  return { type: "mfa_policy", controlRefs, status: hasRequired ? "pass" : "fail", details: { activePolicyCount: active.length, hasRequiredFactor: hasRequired } };
}

function evaluatePasswordPolicy(
  policies: Array<Record<string, unknown>> | null,
): AdapterEvidenceItem {
  const controlRefs = ["SOC2-CC6.1", "ISO-27001-A.9.3.1"];

  if (policies === null) {
    return { type: "password_policy", controlRefs, status: "unknown", details: { error: "Failed to fetch password policies" } };
  }

  const active = policies.filter((p) => p.status === "ACTIVE");
  if (active.length === 0) {
    return { type: "password_policy", controlRefs, status: "fail", details: { reason: "No active password policy found" } };
  }

  const complexity = (
    (active[0].settings as Record<string, unknown> | undefined)?.password as Record<string, unknown> | undefined
  )?.complexity as Record<string, number> | undefined;

  const minLength = complexity?.minLength ?? 0;
  const minLowerCase = complexity?.minLowerCase ?? 0;
  const minUpperCase = complexity?.minUpperCase ?? 0;
  const minNumber = complexity?.minNumber ?? 0;

  const pass = minLength >= 8 && (minLowerCase > 0 || minUpperCase > 0 || minNumber > 0);

  return { type: "password_policy", controlRefs, status: pass ? "pass" : "fail", details: { minLength, minLowerCase, minUpperCase, minNumber } };
}

function evaluateSessionPolicy(
  policies: Array<Record<string, unknown>> | null,
): AdapterEvidenceItem {
  const controlRefs = ["SOC2-CC6.7", "ISO-27001-A.9.4.2"];

  if (policies === null) {
    return { type: "session_policy", controlRefs, status: "unknown", details: { error: "Failed to fetch sign-on policies" } };
  }

  const active = policies.filter((p) => p.status === "ACTIVE");
  if (active.length === 0) {
    return { type: "session_policy", controlRefs, status: "fail", details: { reason: "No active sign-on policy found" } };
  }

  const maxSessionIdleMinutes = (active[0].settings as Record<string, number> | undefined)?.maxSessionIdleMinutes;
  if (maxSessionIdleMinutes === undefined) {
    return { type: "session_policy", controlRefs, status: "fail", details: { reason: "maxSessionIdleMinutes not configured" } };
  }

  return { type: "session_policy", controlRefs, status: maxSessionIdleMinutes <= 60 ? "pass" : "fail", details: { maxSessionIdleMinutes } };
}

app.post("/api/evidence", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
  const token = c.env.OKTA_API_TOKEN;

  const [mfaPolicies, passwordPolicies, sessionPolicies] = await Promise.all([
    fetchOktaPolicies(orgUrl, token, "MFA_ENROLL"),
    fetchOktaPolicies(orgUrl, token, "PASSWORD"),
    fetchOktaPolicies(orgUrl, token, "OKTA_SIGN_ON"),
  ]);

  const items: AdapterEvidenceItem[] = [
    evaluateMfaPolicy(mfaPolicies),
    evaluatePasswordPolicy(passwordPolicies),
    evaluateSessionPolicy(sessionPolicies),
  ];

  return c.json({ items });
});

export default app;
