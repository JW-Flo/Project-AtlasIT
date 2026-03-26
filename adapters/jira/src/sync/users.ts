import type { ScimUserResource, SyncResult } from "../types.js";
import { scimListUsers } from "../client.js";

function mapScimStatus(active: boolean): string {
  return active ? "active" : "inactive";
}

export async function syncUsers(
  directoryId: string,
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;
  let startIndex = 1;
  const count = 100;

  let hasMore = true;
  while (hasMore) {
    const response = await scimListUsers(directoryId, accessToken, {
      startIndex,
      count,
    });

    const users = response.Resources ?? [];

    for (const user of users) {
      const displayName =
        user.displayName ??
        user.name?.formatted ??
        `${user.name?.givenName ?? ""} ${user.name?.familyName ?? ""}`.trim() ??
        user.userName;

      const email =
        user.emails?.find((e) => e.primary)?.value ??
        user.emails?.[0]?.value ??
        user.userName;

      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.id)
        .first<{ id: string }>();

      if (existing) {
        await db
          .prepare(
            `UPDATE directory_users
             SET email = ?, display_name = ?, department = ?, title = ?,
                 status = ?, raw_attributes = ?, updated_at = datetime('now')
             WHERE tenant_id = ? AND external_id = ?`,
          )
          .bind(
            email,
            displayName,
            user.department ?? null,
            user.title ?? null,
            mapScimStatus(user.active),
            JSON.stringify(user),
            tenantId,
            user.id,
          )
          .run();
        updated++;
      } else {
        await db
          .prepare(
            `INSERT INTO directory_users (tenant_id, external_id, email, display_name, department, title, status, raw_attributes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            tenantId,
            user.id,
            email,
            displayName,
            user.department ?? null,
            user.title ?? null,
            mapScimStatus(user.active),
            JSON.stringify(user),
          )
          .run();
        created++;
      }
      total++;
    }

    // SCIM pagination: startIndex is 1-based, advance by items received
    if (
      users.length < count ||
      startIndex + users.length > response.totalResults
    ) {
      hasMore = false;
    } else {
      startIndex += users.length;
    }
  }

  return { created, updated, total };
}
