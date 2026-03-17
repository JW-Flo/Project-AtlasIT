import type { AzureUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

function mapAccountStatus(enabled: boolean): string {
  return enabled ? "active" : "suspended";
}

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
    const displayName =
      user.displayName ??
      [user.givenName, user.surname].filter(Boolean).join(" ").trim();
    const status = mapAccountStatus(user.accountEnabled);

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
           SET email = ?1, display_name = ?2, department = ?3, title = ?4,
               status = ?5, raw_attributes = ?6, updated_at = datetime('now')
           WHERE tenant_id = ?7 AND external_id = ?8`,
        )
        .bind(
          email,
          displayName,
          user.department ?? null,
          user.jobTitle ?? null,
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
           (tenant_id, external_id, email, display_name, department, title, status, raw_attributes)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          tenantId,
          user.id,
          email,
          displayName,
          user.department ?? null,
          user.jobTitle ?? null,
          status,
          JSON.stringify(user),
        )
        .run();
      created++;
    }
  }

  return { created, updated, total: users.length };
}
