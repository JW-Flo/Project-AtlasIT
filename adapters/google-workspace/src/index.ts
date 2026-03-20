import { Hono } from "hono";
import type { Bindings } from "./types.js";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  SCOPES,
} from "./auth/oauth2.js";
import { syncUsers, type LifecycleChange } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { publishEvent } from "./event-publisher.js";
import { signPayload } from "../../../packages/shared/src/crypto/hmac.js";

const app = new Hono<{ Bindings: Bindings }>();

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    service: "google-workspace-connector",
  });
});

// ---------------------------------------------------------------------------
// OAuth2 — initiate
// ---------------------------------------------------------------------------
app.get("/auth/authorize", (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ error: "Missing tenantId query parameter" }, 400);
  }

  const redirectUri = new URL("/auth/callback", c.req.url).toString();
  const state = btoa(JSON.stringify({ tenantId }));

  const url = getAuthorizationUrl(
    c.env.GOOGLE_CLIENT_ID,
    redirectUri,
    SCOPES,
    state,
  );

  return c.redirect(url);
});

// ---------------------------------------------------------------------------
// OAuth2 — callback
// ---------------------------------------------------------------------------
app.get("/auth/callback", async (c) => {
  const code = c.req.query("code");
  const stateRaw = c.req.query("state");
  const errorParam = c.req.query("error");

  if (errorParam) {
    return c.json({ error: `OAuth denied: ${errorParam}` }, 400);
  }

  if (!code || !stateRaw) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  let tenantId: string;
  try {
    const parsed = JSON.parse(atob(stateRaw)) as { tenantId: string };
    tenantId = parsed.tenantId;
  } catch {
    return c.json({ error: "Invalid state parameter" }, 400);
  }

  const redirectUri = new URL("/auth/callback", c.req.url).toString();

  const tokens = await exchangeCodeForTokens(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    code,
    redirectUri,
  );

  // Encrypt tokens before storing
  const encryptedAccess = await encryptValue(
    tokens.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );
  const encryptedRefresh = tokens.refresh_token
    ? await encryptValue(tokens.refresh_token, c.env.CRED_ENCRYPTION_KEY)
    : null;

  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO app_oauth_tokens
     (id, tenant_id, app_id, access_token, refresh_token, token_type, expires_at, scope, raw_response, updated_at)
     VALUES (
       COALESCE(
         (SELECT id FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?),
         lower(hex(randomblob(16)))
       ),
       ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
     )`,
  )
    .bind(
      tenantId,
      "google-workspace",
      tenantId,
      "google-workspace",
      encryptedAccess,
      encryptedRefresh,
      tokens.token_type,
      expiresAt,
      tokens.scope,
      JSON.stringify({ expires_in: tokens.expires_in }),
    )
    .run();

  return c.json({ status: "connected", tenantId });
});

// ---------------------------------------------------------------------------
// Directory sync
// ---------------------------------------------------------------------------
app.post("/api/sync", async (c) => {
  const body = await c.req.json<{ tenantId: string; domain: string }>();
  const { tenantId, domain } = body;

  if (!tenantId || !domain) {
    return c.json({ error: "Missing tenantId or domain" }, 400);
  }

  const correlationId = c.req.header("X-Correlation-ID") ?? crypto.randomUUID();

  // Retrieve encrypted tokens
  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(tenantId, "google-workspace")
    .first<{
      access_token: string;
      refresh_token: string | null;
      expires_at: string;
    }>();

  if (!tokenRow) {
    return c.json(
      { error: "No OAuth tokens found — connect first via /auth/authorize" },
      401,
    );
  }

  let accessToken = await decryptValue(
    tokenRow.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );

  // Refresh if expired
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() >= expiresAt - 60_000) {
    if (!tokenRow.refresh_token) {
      return c.json(
        { error: "Access token expired and no refresh token available" },
        401,
      );
    }

    const refreshToken = await decryptValue(
      tokenRow.refresh_token,
      c.env.CRED_ENCRYPTION_KEY,
    );

    const refreshed = await refreshAccessToken(
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      refreshToken,
    );

    accessToken = refreshed.access_token;
    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000,
    ).toISOString();
    const encryptedNewAccess = await encryptValue(
      refreshed.access_token,
      c.env.CRED_ENCRYPTION_KEY,
    );

    await c.env.DB.prepare(
      `UPDATE app_oauth_tokens
       SET access_token = ?, expires_at = ?, updated_at = datetime('now')
       WHERE tenant_id = ? AND app_id = ?`,
    )
      .bind(encryptedNewAccess, newExpiresAt, tenantId, "google-workspace")
      .run();
  }

  // Update connection status to syncing
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO directory_connections
     (id, tenant_id, provider, status, updated_at)
     VALUES (
       COALESCE(
         (SELECT id FROM directory_connections WHERE tenant_id = ?),
         lower(hex(randomblob(16)))
       ),
       ?, 'google-workspace', 'syncing', datetime('now')
     )`,
  )
    .bind(tenantId, tenantId)
    .run();

  try {
    const userResult = await syncUsers(accessToken, domain, c.env.DB, tenantId);
    const groupResult = await syncGroups(
      accessToken,
      domain,
      c.env.DB,
      tenantId,
    );

    // Update connection with results
    await c.env.DB.prepare(
      `UPDATE directory_connections
       SET status = 'active', last_sync_at = datetime('now'),
           user_count = ?, group_count = ?, error_msg = NULL, updated_at = datetime('now')
       WHERE tenant_id = ?`,
    )
      .bind(userResult.total, groupResult.total, tenantId)
      .run();

    // Publish sync event
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: "directory.synced",
      source: "google-workspace",
      payload: { users: userResult, groups: groupResult },
      correlationId,
      secret: c.env.EVENT_PUBLISH_SECRET,
    });

    // Publish lifecycle events from diff (fire-and-forget, errors are non-fatal)
    for (const change of userResult.lifecycleChanges ?? []) {
      publishEvent({
        orchestratorUrl: c.env.ORCHESTRATOR_URL,
        tenantId,
        type: change.type,
        source: "google-workspace",
        payload: change.payload,
        idempotencyKey: `gws-${change.type}-${change.payload.user.externalId}-${correlationId}`,
        correlationId,
        secret: c.env.EVENT_PUBLISH_SECRET,
      }).catch((err: Error) => {
        console.error(
          JSON.stringify({
            level: "warn",
            message: "Failed to publish lifecycle event",
            eventType: change.type,
            userId: change.payload.user.externalId,
            error: err.message,
          }),
        );
      });
    }

    return c.json({
      status: "synced",
      users: userResult,
      groups: groupResult,
      lifecycleEvents: userResult.lifecycleChanges?.length ?? 0,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown sync error";

    await c.env.DB.prepare(
      `UPDATE directory_connections
       SET status = 'error', error_msg = ?, updated_at = datetime('now')
       WHERE tenant_id = ?`,
    )
      .bind(errorMessage, tenantId)
      .run();

    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        tenantId,
        message: "Directory sync failed",
        error: errorMessage,
      }),
    );

    return c.json({ error: errorMessage }, 500);
  }
});

// ---------------------------------------------------------------------------
// Sync status
// ---------------------------------------------------------------------------
app.get("/api/status", async (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ error: "Missing tenantId query parameter" }, 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT provider, status, error_msg, last_sync_at, user_count, group_count, updated_at
     FROM directory_connections WHERE tenant_id = ?`,
  )
    .bind(tenantId)
    .first<{
      provider: string;
      status: string;
      error_msg: string | null;
      last_sync_at: string | null;
      user_count: number;
      group_count: number;
      updated_at: string;
    }>();

  if (!row) {
    return c.json({ status: "not_connected" });
  }

  return c.json({
    provider: row.provider,
    status: row.status,
    error: row.error_msg,
    lastSyncAt: row.last_sync_at,
    userCount: row.user_count,
    groupCount: row.group_count,
    updatedAt: row.updated_at,
  });
});

// ---------------------------------------------------------------------------
// Encryption helpers (AES-GCM, matches shared/credentials/crypto pattern)
// ---------------------------------------------------------------------------
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const HKDF_SALT = new TextEncoder().encode("atlasit-credential-vault-v1");
const HKDF_INFO = new TextEncoder().encode("credential-encryption");

async function deriveKey(masterKey: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: HKDF_SALT, info: HKDF_INFO },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(encoded: string): ArrayBuffer {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function encryptValue(
  plaintext: string,
  masterKey: string,
): Promise<string> {
  const key = await deriveKey(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  const envelope = JSON.stringify({
    enc: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
    v: 1,
  });
  return envelope;
}

async function decryptValue(
  envelope: string,
  masterKey: string,
): Promise<string> {
  const { enc, iv } = JSON.parse(envelope) as {
    enc: string;
    iv: string;
    v: number;
  };
  const key = await deriveKey(masterKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(base64ToArrayBuffer(iv)) },
    key,
    base64ToArrayBuffer(enc),
  );
  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Provisioning — un-suspend user in Google Workspace
// ---------------------------------------------------------------------------
app.post("/api/provision", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c
    .req
    .json<{ userProfile?: { externalId?: string; email?: string } }>()
    .catch(() => ({}));
  const userId =
    (body as { userProfile?: { externalId?: string; email?: string } })
      ?.userProfile?.externalId ??
    (body as { userProfile?: { externalId?: string; email?: string } })
      ?.userProfile?.email;
  if (!userId) {
    return c.json(
      { error: "userProfile.externalId or userProfile.email required" },
      400,
    );
  }

  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(tenantId, "google-workspace")
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ error: "No OAuth tokens found for tenant" }, 401);
  }

  const accessToken = await decryptValue(
    tokenRow.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );

  const res = await fetch(
    `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suspended: false }),
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    return c.json(
      { error: `Google API error: ${err}` },
      (res.status >= 400 && res.status < 600 ? res.status : 500) as
        | 400
        | 401
        | 403
        | 500,
    );
  }

  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Deprovisioning — suspend user in Google Workspace
// ---------------------------------------------------------------------------
app.post("/api/deprovision", async (c) => {
  const tenantId = c.req.header("X-Tenant-ID");
  if (!tenantId) {
    return c.json({ error: "Missing X-Tenant-ID header" }, 400);
  }

  const body = await c
    .req
    .json<{ userProfile?: { externalId?: string; email?: string } }>()
    .catch(() => ({}));
  const userId =
    (body as { userProfile?: { externalId?: string; email?: string } })
      ?.userProfile?.externalId ??
    (body as { userProfile?: { externalId?: string; email?: string } })
      ?.userProfile?.email;
  if (!userId) {
    return c.json(
      { error: "userProfile.externalId or userProfile.email required" },
      400,
    );
  }

  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(tenantId, "google-workspace")
    .first<{ access_token: string }>();

  if (!tokenRow) {
    return c.json({ error: "No OAuth tokens found for tenant" }, 401);
  }

  const accessToken = await decryptValue(
    tokenRow.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );

  const res = await fetch(
    `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suspended: true }),
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    return c.json(
      { error: `Google API error: ${err}` },
      (res.status >= 400 && res.status < 600 ? res.status : 500) as
        | 400
        | 401
        | 403
        | 500,
    );
  }

  return c.json({ success: true });
});

// ── Compliance evidence collection ──────────────────────────────────────────
// POST /api/compliance/check — check MFA enforcement status in Google Workspace
// and publish compliance.evidence.collected events to the orchestrator.
app.post("/api/compliance/check", async (c) => {
  const body = await c.req.json<{ tenantId: string }>().catch(() => null);
  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required" }, 400);
  }

  // Load OAuth token
  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(body.tenantId, "google-workspace")
    .first<{ access_token: string; refresh_token: string; expires_at: string }>();

  if (!tokenRow) {
    return c.json({ error: "No Google Workspace token for tenant" }, 404);
  }

  let accessToken = await decryptValue(
    tokenRow.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );

  // Check if MFA (2-Step Verification) is enforced for the domain
  // Uses the Google Admin SDK Reports API or Directory API
  const mfaRes = await fetch(
    "https://www.googleapis.com/admin/directory/v1/customers/my_customer/organizations",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  // Fallback: use Google Admin Directory to check security settings
  const securityRes = await fetch(
    "https://www.googleapis.com/admin/directory/v1/users?customer=my_customer&maxResults=1&fields=users(isEnrolledIn2Sv,isEnforcedIn2Sv)",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  let mfaEnforced = false;
  let mfaEnrolledCount = 0;
  let mfaUnenrolledCount = 0;

  if (securityRes.ok) {
    const data = (await securityRes.json()) as {
      users?: Array<{ isEnrolledIn2Sv?: boolean; isEnforcedIn2Sv?: boolean }>;
    };
    // If any user has isEnforcedIn2Sv = true, the policy is enforced
    mfaEnforced = (data.users ?? []).some((u) => u.isEnforcedIn2Sv === true);
  }

  // Also check using the Reports API for a broader signal (best-effort)
  const reportsRes = await fetch(
    "https://www.googleapis.com/admin/reports/v1/activity/users/all/applications/login?eventName=2sv_disable&maxResults=1",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const hasRecentMfaDisable = reportsRes.ok && reportsRes.status !== 204;

  // Publish compliance evidence (HMAC-signed when EVENT_PUBLISH_SECRET is set)
  {
    const isoEventBody = JSON.stringify({
      tenantId: body.tenantId,
      type: "compliance.evidence.collected",
      source: "adapter:google-workspace",
      payload: {
        framework: "ISO27001",
        controlId: "A.9.4.2",
        controlName: "MFA Enforcement — Google Workspace",
        evidenceType: "automated",
        source: "adapter:google-workspace",
        sourceId: "google-workspace",
        actor: "system",
        subject: "Google Workspace domain",
        metadata: {
          mfaEnforced,
          hasRecentMfaDisable,
          checkedAt: new Date().toISOString(),
        },
      },
    });
    const isoHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (c.env.EVENT_PUBLISH_SECRET) {
      isoHeaders["X-Signature"] = await signPayload(isoEventBody, c.env.EVENT_PUBLISH_SECRET);
    }
    await fetch(`${c.env.ORCHESTRATOR_URL}/api/v1/events`, {
      method: "POST",
      headers: isoHeaders,
      body: isoEventBody,
    }).catch((err: Error) => {
      console.error(JSON.stringify({ level: "error", message: "Failed to publish ISO27001 A.9.4.2 evidence", error: err.message, tenantId: body.tenantId }));
    });
  }

  // Also emit SOC2 CC6.8 evidence
  {
    const soc2EventBody = JSON.stringify({
      tenantId: body.tenantId,
      type: "compliance.evidence.collected",
      source: "adapter:google-workspace",
      payload: {
        framework: "SOC2",
        controlId: "CC6.8",
        controlName: "MFA Enforcement — Google Workspace",
        evidenceType: "automated",
        source: "adapter:google-workspace",
        sourceId: "google-workspace",
        actor: "system",
        subject: "Google Workspace domain",
        metadata: { mfaEnforced, checkedAt: new Date().toISOString() },
      },
    });
    const soc2Headers: Record<string, string> = { "Content-Type": "application/json" };
    if (c.env.EVENT_PUBLISH_SECRET) {
      soc2Headers["X-Signature"] = await signPayload(soc2EventBody, c.env.EVENT_PUBLISH_SECRET);
    }
    await fetch(`${c.env.ORCHESTRATOR_URL}/api/v1/events`, {
      method: "POST",
      headers: soc2Headers,
      body: soc2EventBody,
    }).catch((err: Error) => {
      console.error(JSON.stringify({ level: "error", message: "Failed to publish SOC2 CC6.8 evidence", error: err.message, tenantId: body.tenantId }));
    });
  }

  return c.json({ ok: true, mfaEnforced, tenantId: body.tenantId });
});

// ---------------------------------------------------------------------------
// Evidence collection — POST /api/evidence
// Returns structured AdapterEvidenceItem[] for compliance frameworks.
// ---------------------------------------------------------------------------
app.post("/api/evidence", async (c) => {
  const body = await c.req.json<{ tenantId: string }>().catch(() => null);
  if (!body?.tenantId) {
    return c.json({ error: "tenantId is required" }, 400);
  }

  const tokenRow = await c.env.DB.prepare(
    "SELECT access_token, refresh_token, expires_at FROM app_oauth_tokens WHERE tenant_id = ? AND app_id = ?",
  )
    .bind(body.tenantId, "google-workspace")
    .first<{ access_token: string; refresh_token: string; expires_at: string }>();

  if (!tokenRow) {
    return c.json({ items: [] });
  }

  const accessToken = await decryptValue(
    tokenRow.access_token,
    c.env.CRED_ENCRYPTION_KEY,
  );

  // --- mfa_enforcement ---
  let mfaStatus: "pass" | "fail" | "unknown" = "unknown";
  let mfaDetails: Record<string, unknown> = {};

  try {
    const mfaRes = await fetch(
      "https://www.googleapis.com/admin/directory/v1/users?customer=my_customer&maxResults=1&fields=users(isEnrolledIn2Sv,isEnforcedIn2Sv)",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (mfaRes.ok) {
      const data = (await mfaRes.json()) as {
        users?: Array<{ isEnrolledIn2Sv?: boolean; isEnforcedIn2Sv?: boolean }>;
      };
      const users = data.users ?? [];
      const enforced = users.some((u) => u.isEnforcedIn2Sv === true);
      mfaStatus = enforced ? "pass" : "fail";
      mfaDetails = {
        enforcedSample: enforced,
        sampledUsers: users.length,
        checkedAt: new Date().toISOString(),
      };
    } else {
      mfaDetails = {
        reason: `Google API returned ${mfaRes.status}`,
        checkedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    mfaDetails = {
      reason: err instanceof Error ? err.message : "Unknown error",
      checkedAt: new Date().toISOString(),
    };
  }

  const items = [
    {
      type: "mfa_enforcement",
      controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
      status: mfaStatus,
      details: mfaDetails,
    },
    {
      type: "dlp_rules",
      controlRefs: ["SOC2-CC6.7", "GDPR-Art.5(1)(f)"],
      status: "unknown" as const,
      details: {
        reason: "Requires additional API scope (DLP API)",
      },
    },
    {
      type: "sharing_settings",
      controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.1.2"],
      status: "unknown" as const,
      details: {
        reason: "Requires additional API scope (Reports API)",
      },
    },
  ];

  return c.json({ items });
});

export default app;
