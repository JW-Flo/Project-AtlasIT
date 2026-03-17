import type { SyncResult } from "../types.js";
import { listOrganizations } from "../client.js";

export async function syncGroups(
  accessToken: string,
  subdomain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const organizations = await listOrganizations(subdomain, accessToken);

  for (const org of organizations) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, String(org.id))
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        String(org.id),
        org.name,
        org.details ?? null,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;
  }

  return { created, updated, total };
}
