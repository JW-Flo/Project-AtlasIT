/**
 * App credential storage backed by D1.
 *
 * Credentials are encrypted with AES-256-GCM before being written to D1.
 * The encryption key comes from the CRED_ENCRYPTION_KEY wrangler secret.
 * If the secret is not set, credentials are stored as plain JSON (dev mode).
 */

// ---------------------------------------------------------------------------
// Encryption helpers (AES-256-GCM)
// ---------------------------------------------------------------------------

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  // Format: iv_hex:ciphertext_hex
  return `${toHex(iv.buffer)}:${toHex(ct)}`;
}

async function decrypt(ciphertext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const [ivHex, ctHex] = ciphertext.split(":");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export interface StoredCredential {
  app_id: string;
  tenant_id: string;
  connected_at: string;
  updated_at: string;
  last_test_at: string | null;
  healthy: boolean;
}

interface Env {
  ATLAS_SHARED_DB?: D1Database;
  CRED_ENCRYPTION_KEY?: string;
  TENANT_ID?: string;
}

function getEnv(platform: any): Env {
  return (platform?.env as Env) || {};
}

function tenantId(env: Env): string {
  return env.TENANT_ID || "atlasit-prod";
}

/**
 * Save or update credentials for an app.
 */
export async function saveCredentials(
  platform: any,
  appId: string,
  credentials: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return { ok: false, error: "Database not available" };

  const tid = tenantId(env);
  const json = JSON.stringify(credentials);
  const stored = env.CRED_ENCRYPTION_KEY
    ? await encrypt(json, env.CRED_ENCRYPTION_KEY)
    : json;

  await db
    .prepare(
      `INSERT INTO app_credentials (tenant_id, app_id, credentials, connected_at, updated_at, healthy)
       VALUES (?1, ?2, ?3, datetime('now'), datetime('now'), 1)
       ON CONFLICT(tenant_id, app_id) DO UPDATE SET
         credentials = ?3,
         updated_at = datetime('now')`,
    )
    .bind(tid, appId, stored)
    .run();

  return { ok: true };
}

/**
 * Get decrypted credentials for an app.
 */
export async function getCredentials(
  platform: any,
  appId: string,
): Promise<Record<string, string> | null> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;

  const tid = tenantId(env);
  const row = await db
    .prepare(
      "SELECT credentials FROM app_credentials WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId)
    .first<{ credentials: string }>();

  if (!row) return null;

  const json = env.CRED_ENCRYPTION_KEY
    ? await decrypt(row.credentials, env.CRED_ENCRYPTION_KEY)
    : row.credentials;

  return JSON.parse(json);
}

/**
 * List all connected apps for the tenant.
 */
export async function listConnectedApps(
  platform: any,
): Promise<StoredCredential[]> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return [];

  const tid = tenantId(env);
  const { results } = await db
    .prepare(
      "SELECT app_id, tenant_id, connected_at, updated_at, last_test_at, healthy FROM app_credentials WHERE tenant_id = ?1",
    )
    .bind(tid)
    .all<StoredCredential>();

  return (results || []).map((r) => ({ ...r, healthy: !!r.healthy }));
}

/**
 * Disconnect (delete) an app's credentials.
 */
export async function deleteCredentials(
  platform: any,
  appId: string,
): Promise<void> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;

  const tid = tenantId(env);
  await db
    .prepare("DELETE FROM app_credentials WHERE tenant_id = ?1 AND app_id = ?2")
    .bind(tid, appId)
    .run();
  await db
    .prepare(
      "DELETE FROM app_oauth_tokens WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId)
    .run();
}

/**
 * Update the health/test status for an app.
 */
export async function updateTestStatus(
  platform: any,
  appId: string,
  healthy: boolean,
): Promise<void> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;

  const tid = tenantId(env);
  await db
    .prepare(
      "UPDATE app_credentials SET last_test_at = datetime('now'), healthy = ?3 WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId, healthy ? 1 : 0)
    .run();
}

// ---------------------------------------------------------------------------
// OAuth token storage
// ---------------------------------------------------------------------------

export async function saveOAuthTokens(
  platform: any,
  appId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    raw?: any;
  },
): Promise<void> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;

  const tid = tenantId(env);
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Encrypt tokens
  const accessToken = env.CRED_ENCRYPTION_KEY
    ? await encrypt(tokens.access_token, env.CRED_ENCRYPTION_KEY)
    : tokens.access_token;
  const refreshToken =
    tokens.refresh_token && env.CRED_ENCRYPTION_KEY
      ? await encrypt(tokens.refresh_token, env.CRED_ENCRYPTION_KEY)
      : tokens.refresh_token || null;

  await db
    .prepare(
      `INSERT INTO app_oauth_tokens (tenant_id, app_id, access_token, refresh_token, token_type, expires_at, scope, raw_response, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))
       ON CONFLICT(tenant_id, app_id) DO UPDATE SET
         access_token = ?3,
         refresh_token = ?4,
         token_type = ?5,
         expires_at = ?6,
         scope = ?7,
         raw_response = ?8,
         updated_at = datetime('now')`,
    )
    .bind(
      tid,
      appId,
      accessToken,
      refreshToken,
      tokens.token_type || "Bearer",
      expiresAt,
      tokens.scope || null,
      tokens.raw ? JSON.stringify(tokens.raw) : null,
    )
    .run();
}

export async function getOAuthAccessToken(
  platform: any,
  appId: string,
): Promise<string | null> {
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;

  const tid = tenantId(env);
  const row = await db
    .prepare(
      "SELECT access_token FROM app_oauth_tokens WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId)
    .first<{ access_token: string }>();

  if (!row) return null;

  return env.CRED_ENCRYPTION_KEY
    ? await decrypt(row.access_token, env.CRED_ENCRYPTION_KEY)
    : row.access_token;
}
