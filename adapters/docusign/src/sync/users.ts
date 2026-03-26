import type { DocuSignUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

interface DocuSignConfig {
  accountId: string;
  baseUrl: string;
}

export async function syncUsers(
  accessToken: string,
  config: DocuSignConfig,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(config, accessToken);

  for (const user of users) {
    const resolvedEmail = user.email;
    const resolvedName = user.userName;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.userId)
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
        user.userId,
        resolvedEmail,
        resolvedName,
        null, // DocuSign users don't have department in public API
        user.title ?? null,
        user.isActive ? "active" : "inactive",
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
