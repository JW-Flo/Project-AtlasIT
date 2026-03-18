import type { ZscalerUser, ZscalerUsersListResponse, SyncResult } from "../types.js";
import { getZscalerToken, buildBaseUrl, createZscalerFetch } from "../auth.js";

export async function syncUsers(
  clientId: string,
  clientSecret: string,
  vanityDomain: string,
  cloud: string,
  customerId: string,
  db: D1Database,
  kv: KVNamespace,
  tenantId: string,
): Promise<SyncResult> {
  const token = await getZscalerToken(clientId, clientSecret, vanityDomain, cloud, kv);
  const zfetch = createZscalerFetch(token);
  const baseUrl = buildBaseUrl(vanityDomain, cloud);

  const result: SyncResult = { created: 0, updated: 0, total: 0 };

  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}/admin/api/v1/users?pageSize=${pageSize}&page=${page}`;
    const res = await zfetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Zscaler list users failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as ZscalerUsersListResponse | ZscalerUser[];

    // API may return array directly or wrapped object
    const users: ZscalerUser[] = Array.isArray(data)
      ? data
      : (data as ZscalerUsersListResponse).users ?? [];

    for (const user of users) {
      const existing = await db
        .prepare(
          `SELECT id FROM directory_users
           WHERE tenant_id = ?1 AND provider_id = ?2 AND source = 'zscaler'`,
        )
        .bind(tenantId, user.id)
        .first<{ id: string }>();

      if (existing) {
        await db
          .prepare(
            `UPDATE directory_users
             SET email = ?1, display_name = ?2, status = ?3, updated_at = datetime('now')
             WHERE tenant_id = ?4 AND provider_id = ?5 AND source = 'zscaler'`,
          )
          .bind(user.primaryEmail, user.displayName, user.status.toLowerCase(), tenantId, user.id)
          .run();
        result.updated++;
      } else {
        await db
          .prepare(
            `INSERT INTO directory_users
             (id, tenant_id, provider_id, source, email, display_name, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, 'zscaler', ?4, ?5, ?6, datetime('now'), datetime('now'))`,
          )
          .bind(
            crypto.randomUUID(),
            tenantId,
            user.id,
            user.primaryEmail,
            user.displayName,
            user.status.toLowerCase(),
          )
          .run();
        result.created++;
      }
    }

    result.total += users.length;

    // Continue paginating only if a full page was returned
    hasMore = users.length === pageSize;
    page++;
  }

  return result;
}
