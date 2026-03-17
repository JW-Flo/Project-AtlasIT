import type { SalesforceUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

interface SalesforceConfig {
  instanceUrl: string;
}

export async function syncUsers(
  accessToken: string,
  config: SalesforceConfig,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(config, accessToken);

  for (const user of users) {
    const resolvedEmail = user.Email;
    const resolvedName = user.Name;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.Id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        user.Id,
        resolvedEmail,
        resolvedName,
        user.Department ?? null,
        user.Title ?? null,
        user.IsActive ? "active" : "inactive",
        JSON.stringify(user),
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
