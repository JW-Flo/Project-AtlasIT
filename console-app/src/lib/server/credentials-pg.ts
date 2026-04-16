/**
 * PostgreSQL-aware credential retrieval
 * Wrapper around credentials.ts that uses PG when available
 */

import { queryPgOne } from "./pg.js";

/**
 * Resolve the encryption key or handle missing-key policy
 */
function resolveEncryptionKey(env: any, operation: string): string | null {
  if (env.CRED_ENCRYPTION_KEY) {
    return env.CRED_ENCRYPTION_KEY;
  }
  const isDev = (env.NODE_ENV ?? "").toLowerCase() === "development";
  if (isDev) {
    console.warn(
      `[credentials] ${operation}: CRED_ENCRYPTION_KEY not set — using plaintext (dev mode only)`,
    );
    return null;
  }
  throw new Error(`[credentials] ${operation}: CRED_ENCRYPTION_KEY required in production`);
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function decrypt(ciphertext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const [ivHex, ctHex] = ciphertext.split(":");
  if (!ivHex || !ctHex) throw new Error("Malformed ciphertext");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

/**
 * Get app credentials from PostgreSQL
 */
export async function getCredentialsPg(
  env: any,
  appId: string,
  tenantId: string,
): Promise<Record<string, string> | null> {
  if (!tenantId) return null;

  const row = await queryPgOne<{ credentials: string }>(
    "SELECT credentials FROM app_credentials WHERE tenant_id = $1 AND app_id = $2",
    [tenantId, appId],
  );

  if (!row) return null;

  const encKey = resolveEncryptionKey(env, "read");
  const json = encKey ? await decrypt(row.credentials, encKey) : row.credentials;

  return JSON.parse(json);
}
