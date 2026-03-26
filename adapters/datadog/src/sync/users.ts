import type { DatadogUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  apiKey: string,
  appKey: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(apiKey, appKey);

  for (const user of users) {
    const attrs = user.attributes;
    if (!attrs.email) continue;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.id)
      .first<{ id: string }>();

    const status = attrs.disabled
      ? "inactive"
      : attrs.verified
        ? "active"
        : "pending";

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
        attrs.email,
        attrs.name,
        null, // Datadog has no department concept
        null, // Datadog has no title concept
        status,
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
