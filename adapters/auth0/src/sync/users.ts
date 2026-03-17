import type { SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(domain, accessToken);

  for (const user of users) {
    const displayName =
      user.name ?? `${user.given_name ?? ""} ${user.family_name ?? ""}`.trim();
    const status = "active";
    const department =
      (user.app_metadata?.department as string | undefined) ?? null;
    const title = (user.app_metadata?.title as string | undefined) ?? null;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.user_id)
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
        user.user_id,
        user.email,
        displayName,
        department,
        title,
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
