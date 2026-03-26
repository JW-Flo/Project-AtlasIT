import type { XeroUser, SyncResult } from "../types.js";
import { listUsers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  tenantId: string,
  db: D1Database,
  atlastenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const users = await listUsers(accessToken, tenantId);

  for (const user of users) {
    // Xero users have email, firstName, lastName
    const email = user.EmailAddress;
    const displayName = `${user.FirstName} ${user.LastName}`;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(atlastenantId, user.UserID)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        atlastenantId,
        user.UserID,
        email,
        displayName,
        null, // Xero doesn't have department in standard fields
        null, // Xero doesn't have job title in User object
        "active", // Xero users are typically active
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
