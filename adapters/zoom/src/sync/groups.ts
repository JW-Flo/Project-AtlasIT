import type { ZoomGroup, SyncResult } from "../types.js";
import { listGroups, listGroupMembers } from "../client.js";

export async function syncGroups(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const groups = await listGroups(accessToken);

  for (const group of groups) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, group.id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(existing?.id ?? null, tenantId, group.id, group.name, null)
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync group memberships
    await syncGroupMemberships(accessToken, group, db, tenantId);
  }

  return { created, updated, total };
}

async function syncGroupMemberships(
  accessToken: string,
  group: ZoomGroup,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, group.id)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships for this group
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  const members = await listGroupMembers(group.id, accessToken);

  for (const member of members) {
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, member.user_id)
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
