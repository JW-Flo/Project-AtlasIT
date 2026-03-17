import type { GcpGroup, SyncResult } from "../types.js";
import { listGroups, listGroupMemberships } from "../client.js";

export async function syncGroups(
  accessToken: string,
  customerId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const groups = await listGroups(customerId, accessToken);

  for (const group of groups) {
    const externalId = group.name; // e.g. "groups/abc123"

    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, externalId)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        externalId,
        group.displayName,
        group.description ?? null,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync memberships for this group
    await syncGroupMemberships(accessToken, group, db, tenantId);
  }

  return { created, updated, total };
}

async function syncGroupMemberships(
  accessToken: string,
  group: GcpGroup,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, group.name)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships for this group before re-inserting
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  const memberships = await listGroupMemberships(group.name, accessToken);

  for (const membership of memberships) {
    const memberEmail = membership.preferredMemberKey.id;
    // Match user by email in directory_users.
    // GCP IAM users are stored with external_id "user:<email>" or "serviceAccount:<email>"
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND email = ?",
      )
      .bind(tenantId, memberEmail)
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
