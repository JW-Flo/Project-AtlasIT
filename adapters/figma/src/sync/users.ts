import type { SyncResult } from "../types.js";
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

  const members = await listTeamMembers(teamId, accessToken);

  for (const user of members) {
    const displayName = user.handle ?? user.email;
    const status = "active";
    // Figma user objects do not carry department/title; stored as null
    const department: string | null = null;
    const title: string | null = null;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.id)
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
        user.id,
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
