async function deriveKey(secret) {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt"
  ]);
}
function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
async function encrypt(plaintext, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${toHex(iv.buffer)}:${toHex(ct)}`;
}
async function decrypt(ciphertext, secret) {
  const key = await deriveKey(secret);
  const [ivHex, ctHex] = ciphertext.split(":");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
function getEnv(platform) {
  return platform?.env || {};
}
function isDev(env) {
  return (env.NODE_ENV ?? "").toLowerCase() === "development";
}
function resolveEncryptionKey(env, operation) {
  if (env.CRED_ENCRYPTION_KEY) {
    return env.CRED_ENCRYPTION_KEY;
  }
  if (isDev(env)) {
    console.warn(
      `[credentials] CRED_ENCRYPTION_KEY is not set — storing/reading ${operation} as plaintext. This is only acceptable in local development.`
    );
    return null;
  }
  throw new Error(
    `CRED_ENCRYPTION_KEY is required in production but is not set. Refusing to ${operation} credentials without encryption.`
  );
}
async function saveCredentials(platform, appId, credentials, tid) {
  if (!tid) return { ok: false, error: "Tenant ID required" };
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return { ok: false, error: "Database not available" };
  const json = JSON.stringify(credentials);
  const encKey = resolveEncryptionKey(env, "store");
  const stored = encKey ? await encrypt(json, encKey) : json;
  await db.prepare(
    `INSERT INTO app_credentials (tenant_id, app_id, credentials, connected_at, updated_at, healthy)
       VALUES (?1, ?2, ?3, datetime('now'), datetime('now'), 1)
       ON CONFLICT(tenant_id, app_id) DO UPDATE SET
         credentials = ?3,
         updated_at = datetime('now')`
  ).bind(tid, appId, stored).run();
  return { ok: true };
}
async function getCredentials(platform, appId, tid) {
  if (!tid) return null;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;
  const row = await db.prepare(
    "SELECT credentials FROM app_credentials WHERE tenant_id = ?1 AND app_id = ?2"
  ).bind(tid, appId).first();
  if (!row) return null;
  const encKey = resolveEncryptionKey(env, "read");
  const json = encKey ? await decrypt(row.credentials, encKey) : row.credentials;
  return JSON.parse(json);
}
async function listConnectedApps(platform, tid) {
  if (!tid) return [];
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return [];
  const { results } = await db.prepare(
    "SELECT app_id, tenant_id, connected_at, updated_at, last_test_at, healthy FROM app_credentials WHERE tenant_id = ?1"
  ).bind(tid).all();
  return (results || []).map((r) => ({ ...r, healthy: !!r.healthy }));
}
async function deleteCredentials(platform, appId, tid) {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
  await db.prepare("DELETE FROM app_credentials WHERE tenant_id = ?1 AND app_id = ?2").bind(tid, appId).run();
  await db.prepare(
    "DELETE FROM app_oauth_tokens WHERE tenant_id = ?1 AND app_id = ?2"
  ).bind(tid, appId).run();
}
async function updateTestStatus(platform, appId, healthy, tid) {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
  await db.prepare(
    "UPDATE app_credentials SET last_test_at = datetime('now'), healthy = ?3 WHERE tenant_id = ?1 AND app_id = ?2"
  ).bind(tid, appId, healthy ? 1 : 0).run();
}
async function saveOAuthTokens(platform, appId, tokens, tid) {
  if (!tid) return;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return;
  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1e3).toISOString() : null;
  const encKey = resolveEncryptionKey(env, "store OAuth tokens");
  const accessToken = encKey ? await encrypt(tokens.access_token, encKey) : tokens.access_token;
  const refreshToken = tokens.refresh_token && encKey ? await encrypt(tokens.refresh_token, encKey) : tokens.refresh_token || null;
  await db.prepare(
    `INSERT INTO app_oauth_tokens (tenant_id, app_id, access_token, refresh_token, token_type, expires_at, scope, raw_response, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))
       ON CONFLICT(tenant_id, app_id) DO UPDATE SET
         access_token = ?3,
         refresh_token = ?4,
         token_type = ?5,
         expires_at = ?6,
         scope = ?7,
         raw_response = ?8,
         updated_at = datetime('now')`
  ).bind(
    tid,
    appId,
    accessToken,
    refreshToken,
    tokens.token_type || "Bearer",
    expiresAt,
    tokens.scope || null,
    tokens.raw ? JSON.stringify(tokens.raw) : null
  ).run();
}
async function getOAuthAccessToken(platform, appId, tid) {
  if (!tid) return null;
  const env = getEnv(platform);
  const db = env.ATLAS_SHARED_DB;
  if (!db) return null;
  const row = await db.prepare(
    "SELECT access_token FROM app_oauth_tokens WHERE tenant_id = ?1 AND app_id = ?2"
  ).bind(tid, appId).first();
  if (!row) return null;
  const encKey = resolveEncryptionKey(env, "read OAuth token");
  return encKey ? await decrypt(row.access_token, encKey) : row.access_token;
}
function validateEncryptionConfig(env) {
  const isDevelopment = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  if (isDevelopment) return;
  if (!env.CRED_ENCRYPTION_KEY) {
    console.error(
      "[SECURITY] CRED_ENCRYPTION_KEY is not set in production. OAuth tokens will fail to encrypt/decrypt."
    );
  }
}

export { saveOAuthTokens as a, getOAuthAccessToken as b, deleteCredentials as d, getCredentials as g, listConnectedApps as l, saveCredentials as s, updateTestStatus as u, validateEncryptionConfig as v };
//# sourceMappingURL=credentials-CkBYNzQv.js.map
