import { Hono } from "hono";
import type { Bindings } from "./types.js";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  SCOPES,
} from "./auth/oauth2.js";
import { syncUsers } from "./sync/users.js";
import { syncGroups } from "./sync/groups.js";
import { publishEvent } from "./event-publisher.js";

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

    // Publish sync events
    await publishEvent(
      c.env.ORCHESTRATOR_URL,
      tenantId,
      "directory.synced",
      "google-workspace",
      { users: userResult, groups: groupResult },
      correlationId,
    );

    return c.json({
      status: "synced",
      users: userResult,
      groups: groupResult,
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

export default app;
