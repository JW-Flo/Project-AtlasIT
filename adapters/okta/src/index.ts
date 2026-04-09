import { Hono } from "hono";
import type { Bindings, SyncResult } from "./types.js";
import { syncDirectory } from "./sync.js";
import { handleVerification, handleEventHook } from "./webhooks.js";
import { scimRouter } from "./scim/router.js";

const app = new Hono<{ Bindings: Bindings; Variables: { correlationId: string } }>();

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

app.use("*", async (c, next) => {
  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("X-Correlation-ID", correlationId);
  await next();
});

app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
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

  const correlationId = c.get("correlationId");

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

interface UserProfile {
  id?: string;
  externalId?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  title?: string;
  manager?: string;
  phone?: string;
  groups?: string[];
  appAccess?: unknown[];
  rawAttributes?: Record<string, unknown>;
}

interface JmlRequestBody {
  tenantId?: string;
  userProfile?: UserProfile;
  config?: Record<string, unknown>;
}

app.post("/api/provision", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c.req.json<JmlRequestBody>().catch(() => null);
  if (!body?.userProfile) {
    return c.json({ error: "Missing userProfile in request body" }, 400);
  }

  const { userProfile } = body;
  if (!userProfile.email) {
    return c.json({ error: "userProfile.email is required" }, 400);
  }

  const correlationId = c.get("correlationId");
  const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
  const token = c.env.OKTA_API_TOKEN;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Provisioning Okta user",
      email: userProfile.email,
    }),
  );

  try {
    const res = await fetch(`${orgUrl}/api/v1/users?activate=true`, {
      method: "POST",
      headers: {
        Authorization: `SSWS ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        profile: {
          firstName: userProfile.firstName ?? "",
          lastName: userProfile.lastName ?? "",
          email: userProfile.email,
          login: userProfile.email,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Idempotent: if user already exists, treat as success
      if (res.status === 400 && errText.includes("E0000001")) {
        return c.json({ status: "provisioned", correlationId, note: "user already exists in Okta" });
      }
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Okta provision failed",
          status: res.status,
          body: errText,
        }),
      );
      return c.json(
        { error: `Okta API error: ${res.status}`, correlationId },
        res.status >= 500 ? 502 : 400,
      );
    }

    const created = (await res.json()) as Record<string, unknown>;

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "Okta user provisioned",
        oktaUserId: created.id,
        email: userProfile.email,
      }),
    );

    return c.json({ status: "provisioned", correlationId, oktaUserId: created.id });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown provision error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Provision request failed",
        error: errorMsg,
      }),
    );
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

app.post("/api/deprovision", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c.req.json<JmlRequestBody>().catch(() => null);
  if (!body?.userProfile) {
    return c.json({ error: "Missing userProfile in request body" }, 400);
  }

  const { userProfile } = body;
  if (!userProfile.email) {
    return c.json({ error: "userProfile.email is required" }, 400);
  }

  const correlationId = c.get("correlationId");
  const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
  const token = c.env.OKTA_API_TOKEN;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Deprovisioning Okta user",
      email: userProfile.email,
    }),
  );

  try {
    const search = encodeURIComponent(`profile.email eq "${userProfile.email}"`);
    const lookupRes = await fetch(`${orgUrl}/api/v1/users?search=${search}`, {
      headers: {
        Authorization: `SSWS ${token}`,
        Accept: "application/json",
      },
    });

    if (!lookupRes.ok) {
      const errText = await lookupRes.text();
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Okta user lookup failed",
          status: lookupRes.status,
          body: errText,
        }),
      );
      return c.json(
        { error: `Okta API error during lookup: ${lookupRes.status}`, correlationId },
        502,
      );
    }

    const users = (await lookupRes.json()) as Array<Record<string, unknown>>;
    if (users.length === 0) {
      console.log(
        JSON.stringify({
          level: "info",
          correlationId,
          tenantId,
          message: "Okta user not found, treating as already deprovisioned",
          email: userProfile.email,
        }),
      );
      return c.json({ status: "deprovisioned", correlationId, note: "user not found in Okta" });
    }

    const oktaUserId = users[0].id as string;

    const deactivateRes = await fetch(`${orgUrl}/api/v1/users/${oktaUserId}/lifecycle/deactivate`, {
      method: "POST",
      headers: {
        Authorization: `SSWS ${token}`,
        Accept: "application/json",
      },
    });

    if (!deactivateRes.ok) {
      const errText = await deactivateRes.text();
      console.error(
        JSON.stringify({
          level: "error",
          correlationId,
          tenantId,
          message: "Okta deactivation failed",
          oktaUserId,
          status: deactivateRes.status,
          body: errText,
        }),
      );
      return c.json(
        { error: `Okta API error during deactivation: ${deactivateRes.status}`, correlationId },
        deactivateRes.status >= 500 ? 502 : 400,
      );
    }

    console.log(
      JSON.stringify({
        level: "info",
        correlationId,
        tenantId,
        message: "Okta user deprovisioned",
        oktaUserId,
        email: userProfile.email,
      }),
    );

    return c.json({ status: "deprovisioned", correlationId, oktaUserId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown deprovision error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Deprovision request failed",
        error: errorMsg,
      }),
    );
    return c.json({ error: errorMsg, correlationId }, 500);
  }
});

// ── NHI (Non-Human Identity) discovery ──────────────────────────────────────

interface NhiIdentity {
  externalId: string;
  displayName: string;
  identityType: "api_key" | "service";
  credentialType: "api_key" | "oauth_app";
  ownerEmail?: string;
  scopes?: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  metadata?: Record<string, unknown>;
}

async function fetchApiTokens(
  orgUrl: string,
  token: string,
): Promise<Array<Record<string, unknown>> | null> {
  try {
    const res = await fetch(`${orgUrl}/api/v1/api-tokens`, {
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

async function fetchServiceApps(
  orgUrl: string,
  token: string,
): Promise<Array<Record<string, unknown>> | null> {
  try {
    const res = await fetch(
      `${orgUrl}/api/v1/apps?filter=status+eq+"ACTIVE"&limit=200`,
      {
        headers: {
          Authorization: `SSWS ${token}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch {
    return null;
  }
}

// ── OAuth grant discovery for Shadow AI detection ────────────────────────────
app.post("/api/oauth-grants", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) return c.json({ error: "Missing X-Tenant-ID header" }, 400);

  const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
  const token = c.env.OKTA_API_TOKEN;

  type OAuthGrant = {
    appName: string;
    appDomain?: string;
    clientId: string;
    userEmail: string;
    scopes: string[];
    grantedAt?: string;
    lastUsedAt?: string;
    metadata?: Record<string, unknown>;
  };

  const grants: OAuthGrant[] = [];

  try {
    // List OAuth apps in the Okta org
    const appsRes = await fetch(`${orgUrl}/api/v1/apps?limit=200&filter=status eq "ACTIVE"`, {
      headers: { Authorization: `SSWS ${token}`, Accept: "application/json" },
    });

    if (!appsRes.ok) {
      return c.json({ provider: "okta", grants: [], discoveredAt: new Date().toISOString(), error: `Apps API: HTTP ${appsRes.status}` });
    }

    const apps = (await appsRes.json()) as Array<{
      id: string;
      label: string;
      name: string;
      signOnMode?: string;
      credentials?: { oauthClient?: { client_id?: string } };
      _links?: { appLinks?: Array<{ href?: string }> };
    }>;

    // Filter to OAuth/OIDC apps
    const oauthApps = apps.filter(
      (a) => a.signOnMode === "OPENID_CONNECT" || a.signOnMode === "OAUTH_2_0" || a.name?.includes("oidc"),
    );

    // For each OAuth app, list assigned users (limited to first 50 users per app)
    for (const app of oauthApps.slice(0, 30)) {
      try {
        const usersRes = await fetch(`${orgUrl}/api/v1/apps/${app.id}/users?limit=50`, {
          headers: { Authorization: `SSWS ${token}`, Accept: "application/json" },
        });

        if (!usersRes.ok) continue;

        const appUsers = (await usersRes.json()) as Array<{
          id: string;
          credentials?: { userName?: string };
          profile?: { email?: string };
          created?: string;
          lastUpdated?: string;
          scope?: string;
        }>;

        for (const u of appUsers) {
          grants.push({
            appName: app.label || app.name,
            clientId: app.credentials?.oauthClient?.client_id || app.id,
            userEmail: u.credentials?.userName || u.profile?.email || "unknown",
            scopes: u.scope ? u.scope.split(" ") : [],
            grantedAt: u.created,
            lastUsedAt: u.lastUpdated,
            metadata: { oktaAppId: app.id, signOnMode: app.signOnMode },
          });
        }
      } catch {
        // continue to next app
      }
    }
  } catch (err) {
    return c.json({
      provider: "okta",
      grants: [],
      discoveredAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }

  return c.json({ provider: "okta", grants, discoveredAt: new Date().toISOString() });
});

app.post("/api/nhi/discovery", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const correlationId = c.get("correlationId");
  const orgUrl = c.env.OKTA_ORG_URL.replace(/\/$/, "");
  const token = c.env.OKTA_API_TOKEN;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "Starting NHI discovery",
    }),
  );

  const [apiTokens, serviceApps] = await Promise.all([
    fetchApiTokens(orgUrl, token),
    fetchServiceApps(orgUrl, token),
  ]);

  const identities: NhiIdentity[] = [];

  if (apiTokens !== null) {
    for (const t of apiTokens) {
      identities.push({
        externalId: (t.id as string | undefined) ?? String(t.name),
        displayName: (t.name as string | undefined) ?? "Unknown API Token",
        identityType: "api_key",
        credentialType: "api_key",
        ownerEmail: (t.userId as string | undefined) ?? undefined,
        expiresAt: (t.expiresAt as string | undefined) ?? undefined,
        lastUsedAt: (t.lastUpdated as string | undefined) ?? undefined,
        metadata: {
          clientName: t.clientName,
          created: t.created,
          tokenWindow: t.tokenWindow,
        },
      });
    }
  }

  if (serviceApps !== null) {
    const serviceTypes = new Set(["SERVICE", "BROWSER_PLUGIN", "SAML_2_0", "WS_FEDERATION"]);
    for (const app of serviceApps) {
      const signOnMode = (app.signOnMode as string | undefined) ?? "";
      const appName = (app.name as string | undefined) ?? "";
      const label = (app.label as string | undefined) ?? appName;
      const credentials = app.credentials as Record<string, unknown> | undefined;
      const oauthClient = credentials?.oauthClient as Record<string, unknown> | undefined;

      // Include service-type apps and OAuth client apps (M2M / service accounts)
      const isService =
        serviceTypes.has(signOnMode) ||
        oauthClient !== undefined ||
        signOnMode === "OPENID_CONNECT";

      if (!isService) continue;

      const settings = app.settings as Record<string, unknown> | undefined;
      const oauthSettings = settings?.oauthClient as Record<string, unknown> | undefined;
      const grantTypes = (oauthSettings?.grant_types as string[] | undefined) ?? [];

      identities.push({
        externalId: (app.id as string | undefined) ?? label,
        displayName: label,
        identityType: "service",
        credentialType: "oauth_app",
        scopes: (oauthSettings?.scopes as string[] | undefined) ?? undefined,
        lastUsedAt: (app.lastUpdated as string | undefined) ?? undefined,
        metadata: {
          signOnMode,
          status: app.status,
          created: app.created,
          grantTypes,
          appName,
        },
      });
    }
  }

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      tenantId,
      message: "NHI discovery completed",
      identityCount: identities.length,
      apiTokensFound: apiTokens?.length ?? "error",
      serviceAppsScanned: serviceApps?.length ?? "error",
    }),
  );

  return c.json({
    provider: "okta",
    identities,
    discoveredAt: new Date().toISOString(),
  });
});

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
