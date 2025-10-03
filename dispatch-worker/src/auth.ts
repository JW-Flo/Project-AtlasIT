interface D1Stmt {
  bind(...v: any[]): D1Stmt;
  first<T = any>(): Promise<T | null>;
  run(): Promise<any>;
}
interface D1 {
  prepare(q: string): D1Stmt;
}

export interface EnvAuth {
  ATLASIT_DB?: D1;
}
export interface TenantAuthResult {
  ok: boolean;
  reason?: string;
  tenantId?: string;
}

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resetIfNeeded(db: D1, tenantId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const row = await db
    .prepare(`SELECT last_reset_utc FROM tenant_api_keys WHERE tenant_id = ?`)
    .bind(tenantId)
    .first<any>();
  if (!row) return;
  if (!row?.last_reset_utc?.startsWith(today)) {
    await db
      .prepare(
        `UPDATE tenant_api_keys SET remaining_today = daily_quota, last_reset_utc = ? WHERE tenant_id = ?`,
      )
      .bind(new Date().toISOString(), tenantId)
      .run();
  }
}

export async function verifyAuth(
  env: EnvAuth,
  authHeader: string | null,
): Promise<TenantAuthResult> {
  if (!env.ATLASIT_DB) return { ok: false, reason: "db_unavailable" };
  if (!authHeader?.startsWith("Bearer "))
    return { ok: false, reason: "missing_token" };
  const token = authHeader.slice(7).trim();
  if (!token) return { ok: false, reason: "empty_token" };
  const hash = await sha256(token);
  const row = await env.ATLASIT_DB.prepare(
    `SELECT tenant_id, remaining_today FROM tenant_api_keys WHERE key_hash = ?`,
  )
    .bind(hash)
    .first<any>();
  if (!row) return { ok: false, reason: "invalid_token" };
  await resetIfNeeded(env.ATLASIT_DB, row.tenant_id);
  const quota = await env.ATLASIT_DB.prepare(
    `SELECT remaining_today, daily_quota FROM tenant_api_keys WHERE tenant_id = ?`,
  )
    .bind(row.tenant_id)
    .first<any>();
  if (quota?.remaining_today <= 0)
    return { ok: false, reason: "quota_exhausted", tenantId: row.tenant_id };
  await env.ATLASIT_DB.prepare(
    `UPDATE tenant_api_keys SET remaining_today = remaining_today - 1 WHERE tenant_id = ? AND remaining_today > 0`,
  )
    .bind(row.tenant_id)
    .run();
  return { ok: true, tenantId: row.tenant_id };
}

export async function bootstrapApiKey(
  env: EnvAuth,
  tenantId: string,
  rawKey: string,
  dailyQuota = 5000,
) {
  if (!env.ATLASIT_DB) throw new Error("DB unavailable");
  const keyHash = await sha256(rawKey);
  await env.ATLASIT_DB.prepare(
    `INSERT OR REPLACE INTO tenant_api_keys (tenant_id, key_hash, daily_quota, remaining_today, last_reset_utc)
    VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(tenantId, keyHash, dailyQuota, dailyQuota, new Date().toISOString())
    .run();
}
