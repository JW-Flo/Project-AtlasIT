import type { SyncResult } from "../types.js";
import { listGroups, getGroupMembers } from "../client.js";

export async function syncGroups(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;

  const groups = await listGroups(accessToken);

  for (const group of groups) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, group.id)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_groups
           SET name = ?, description = ?, updated_at = datetime('now')
           WHERE tenant_id = ? AND external_id = ?`,
        )
        .bind(group.displayName, group.description ?? null, tenantId, group.id)
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_groups
           (id, tenant_id, external_id, name, description, updated_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(tenantId, group.id, group.displayName, group.description ?? null)
        .run();
      created++;
    }

    // Sync memberships for this group
    await syncGroupMemberships(accessToken, group.id, db, tenantId);
  }

  return { created, updated, total: groups.length };
}

async function syncGroupMemberships(
  accessToken: string,
  groupExternalId: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, groupExternalId)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Clear existing memberships for this group within the tenant
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  const members = await getGroupMembers(accessToken, groupExternalId);

  for (const member of members) {
    // Only process user-type members
    if (member["@odata.type"] !== "#microsoft.graph.user") continue;

    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, member.id)
      .first<{ id: string }>();

    if (!userRow) continue;

    await db
      .prepare(
        `INSERT OR IGNORE INTO directory_memberships (tenant_id, user_id, group_id)
         VALUES (?, ?, ?)`,
      )
      .bind(tenantId, userRow.id, groupRow.id)
      .run();
  }
}
