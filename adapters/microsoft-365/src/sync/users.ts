import type { GraphUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;

  const users = await listUsers(accessToken);

  for (const user of users) {
    const email = user.mail ?? user.userPrincipalName;
    const displayName = user.displayName ?? "";
    const firstName = user.givenName ?? null;
    const lastName = user.surname ?? null;
    const department = user.department ?? null;
    const title = user.jobTitle ?? null;
    const status = user.accountEnabled === false ? "suspended" : "active";

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
           SET email = ?, display_name = ?, first_name = ?, last_name = ?,
               department = ?, title = ?, status = ?,
               raw_attributes = ?, updated_at = datetime('now')
           WHERE tenant_id = ? AND external_id = ?`,
        )
        .bind(
          email,
          displayName,
          firstName,
          lastName,
          department,
          title,
          status,
          JSON.stringify(user),
          tenantId,
          user.id,
        )
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_users
           (id, tenant_id, external_id, email, display_name, first_name, last_name,
            department, title, status, raw_attributes, updated_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(
          tenantId,
          user.id,
          email,
          displayName,
          firstName,
          lastName,
          department,
          title,
          status,
          JSON.stringify(user),
        )
        .run();
      created++;
    }
  }

  return { created, updated, total: users.length };
}
