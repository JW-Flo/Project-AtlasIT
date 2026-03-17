import type { CanvaUser, SyncResult } from "../types.js";
import { listTeamMembers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  teamId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await listTeamMembers(accessToken, teamId, cursor);

    for (const user of response.items) {
      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.id)
        .first<{ id: string }>();

      const resolvedEmail = user.email || user.id;
      const resolvedName = user.name || user.id;

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
          resolvedEmail,
          resolvedName,
          null,
          user.role,
          "active",
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

    hasMore = response.has_more ?? false;
    cursor = response.cursor;
  }

  return { created, updated, total };
}
