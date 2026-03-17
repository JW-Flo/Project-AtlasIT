import type { PagerDutyUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  apiKey: string,
  db: D1Database,
  tenantId: string,
  defaultRole?: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(apiKey);

  for (const user of users) {
    // Skip users without email
    if (!user.email) continue;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.id)
      .first<{ id: string }>();

    const status =
      user.invitation_sent && !user.confirmation_token ? "pending" : "active";

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        user.id,
        user.email,
        user.name,
        null, // PagerDuty has no department concept
        null, // PagerDuty has no title concept
        status,
        JSON.stringify({ ...user, defaultRole }),
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
