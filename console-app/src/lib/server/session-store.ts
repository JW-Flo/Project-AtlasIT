import { queryPg, queryPgOne } from "./pg";

interface SessionRecord {
  id: string;
  data: Record<string, unknown>;
  expires_at: string;
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const row = await queryPgOne<SessionRecord>(
    "SELECT data FROM sessions WHERE id = $1 AND expires_at > NOW()",
    [sessionId],
  );
  if (!row) return null;
  return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
}

export async function putSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds: number,
): Promise<void> {
  await queryPg(
    `INSERT INTO sessions (id, data, expires_at, updated_at)
     VALUES ($1, $2, NOW() + ($3 || ' seconds')::INTERVAL, NOW())
     ON CONFLICT (id) DO UPDATE SET data = $2, expires_at = NOW() + ($3 || ' seconds')::INTERVAL, updated_at = NOW()`,
    [sessionId, JSON.stringify(data), String(ttlSeconds)],
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  await queryPg("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

export async function getTenantStatus(tenantId: string): Promise<string | null> {
  const row = await queryPgOne<{ status: string }>(
    "SELECT status FROM tenants WHERE id = $1 LIMIT 1",
    [tenantId],
  );
  return row?.status ?? null;
}
