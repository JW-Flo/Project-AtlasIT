import type { OnePasswordUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  scimBridgeUrl: string,
  token: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(scimBridgeUrl, token);

  for (const user of users) {
    // Extract email from emails array
    const email = user.emails?.[0]?.value;
    if (!email) continue;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.id)
      .first<{ id: string }>();

    const status = user.active ? "active" : "inactive";

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
        email,
        user.displayName,
        null, // 1Password SCIM has no department concept
        null, // 1Password SCIM has no title concept
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
