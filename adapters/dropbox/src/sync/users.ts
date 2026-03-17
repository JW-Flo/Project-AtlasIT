import type { DropboxUser, SyncResult } from "../types.js";
import { listTeamMembers, continueListingTeamMembers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = cursor
      ? await continueListingTeamMembers(accessToken, cursor)
      : await listTeamMembers(accessToken);

    for (const member of response.members) {
      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, member.account_id)
        .first<{ id: string }>();

      const resolvedEmail = member.email || member.account_id;
      const resolvedName = member.display_name || member.account_id;

      await db
        .prepare(
          `INSERT OR REPLACE INTO directory_users
           (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
           VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(
          existing?.id ?? null,
          tenantId,
          member.account_id,
          resolvedEmail,
          resolvedName,
          null,
          null,
          member.disabled ? "inactive" : "active",
          JSON.stringify(member),
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
