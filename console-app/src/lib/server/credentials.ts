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
  NODE_ENV?: string;
}

function getEnv(platform: any): Env {
  return (platform?.env as Env) || {};
}

/**
 * Returns true when running in a local development environment.
 * In production (Cloudflare Workers), NODE_ENV is never set to "development",
 * so this check cannot be accidentally satisfied in prod.
 */
function isDev(env: Env): boolean {
  return (env.NODE_ENV ?? "").toLowerCase() === "development";
}

/**
 * Resolve the encryption key or handle missing-key policy.
 *
 * - If the key is present: return it.
 * - If the key is absent in dev: log a warning and return null (plaintext fallback).
 * - If the key is absent in prod: throw — plaintext storage is not allowed.
 */
function resolveEncryptionKey(env: Env, operation: string): string | null {
  if (env.CRED_ENCRYPTION_KEY) {
    return env.CRED_ENCRYPTION_KEY;
  }
  if (isDev(env)) {
    console.warn(
      `[credentials] CRED_ENCRYPTION_KEY is not set — storing/reading ${operation} as plaintext. ` +
        "This is only acceptable in local development.",
    );
    return null;
  }
  throw new Error(
    `CRED_ENCRYPTION_KEY is required in production but is not set. ` +
      `Refusing to ${operation} credentials without encryption.`,
  );
}

/**
 * Save or update credentials for an app.
 */
export async function saveCredentials(
  platform: any,
  appId: string,
  credentials: Record<string, string>,
  tid: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!tid) return { ok: false, error: "Tenant ID required" };
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return { ok: false, error: "Database not available" };
  const json = JSON.stringify(credentials);
  const encKey = resolveEncryptionKey(env, "store");
  const stored = encKey ? await encrypt(json, encKey) : json;

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
  tid: string,
): Promise<Record<string, string> | null> {
  if (!tid) return null;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;
  const row = await db
    .prepare(
      "SELECT credentials FROM app_credentials WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId)
    .first<{ credentials: string }>();

  if (!row) return null;

  const encKey = resolveEncryptionKey(env, "read");
  const json = encKey
    ? await decrypt(row.credentials, encKey)
    : row.credentials;

  return JSON.parse(json);
}

/**
 * List all connected apps for the tenant.
 */
export async function listConnectedApps(
  platform: any,
  tid: string,
): Promise<StoredCredential[]> {
  if (!tid) return [];
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return [];
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
  tid: string,
): Promise<void> {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
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
  tid: string,
): Promise<void> {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
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
  tid: string,
): Promise<void> {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Encrypt tokens
  const encKey = resolveEncryptionKey(env, "store OAuth tokens");
  const accessToken = encKey
    ? await encrypt(tokens.access_token, encKey)
    : tokens.access_token;
  const refreshToken =
    tokens.refresh_token && encKey
      ? await encrypt(tokens.refresh_token, encKey)
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
  tid: string,
): Promise<string | null> {
  if (!tid) return null;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;
  const row = await db
    .prepare(
      "SELECT access_token FROM app_oauth_tokens WHERE tenant_id = ?1 AND app_id = ?2",
    )
    .bind(tid, appId)
    .first<{ access_token: string }>();

  if (!row) return null;

  const encKey = resolveEncryptionKey(env, "read OAuth token");
  return encKey ? await decrypt(row.access_token, encKey) : row.access_token;
}

export function validateEncryptionConfig(env: Record<string, unknown>): void {
  const isDevelopment =
    typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  if (isDevelopment) return;
  if (!env.CRED_ENCRYPTION_KEY) {
    console.error(
      "[SECURITY] CRED_ENCRYPTION_KEY is not set in production. OAuth tokens will fail to encrypt/decrypt.",
    );
  }
}
