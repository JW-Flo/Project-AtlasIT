import type { ZscalerGroup, ZscalerGroupsListResponse, SyncResult } from "../types.js";
import { getZscalerToken, buildBaseUrl, createZscalerFetch } from "../auth.js";

export async function syncGroups(
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

  const url = `${baseUrl}/admin/api/v1/groups`;
  const res = await zfetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zscaler list groups failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as ZscalerGroupsListResponse | ZscalerGroup[];
  const groups: ZscalerGroup[] = Array.isArray(data)
    ? data
    : (data as ZscalerGroupsListResponse).groups ?? [];

  for (const group of groups) {
    const existing = await db
      .prepare(
        `SELECT id FROM directory_groups
         WHERE tenant_id = ?1 AND provider_id = ?2 AND source = 'zscaler'`,
      )
      .bind(tenantId, group.id)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_groups
           SET name = ?1, updated_at = datetime('now')
           WHERE tenant_id = ?2 AND provider_id = ?3 AND source = 'zscaler'`,
        )
        .bind(group.name, tenantId, group.id)
        .run();
      result.updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_groups
           (id, tenant_id, provider_id, source, name, created_at, updated_at)
           VALUES (?1, ?2, ?3, 'zscaler', ?4, datetime('now'), datetime('now'))`,
        )
        .bind(crypto.randomUUID(), tenantId, group.id, group.name)
        .run();
      result.created++;
    }
  }

  result.total = groups.length;

  return result;
}
