import type { ScimGroupResource, SyncResult } from "../types.js";
import { scimListGroups, scimGetGroup } from "../client.js";

export async function syncGroups(
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
    const response = await scimListGroups(directoryId, accessToken, {
      startIndex,
      count,
    });

    const groups = response.Resources ?? [];

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
             SET name = ?, updated_at = datetime('now')
             WHERE tenant_id = ? AND external_id = ?`,
          )
          .bind(group.displayName, tenantId, group.id)
          .run();
        updated++;
      } else {
        await db
          .prepare(
            `INSERT INTO directory_groups (tenant_id, external_id, name, description)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(tenantId, group.id, group.displayName, null)
          .run();
        created++;
      }
      total++;

      // Sync memberships for this group -- fetch full group to get members
      await syncGroupMemberships(
        directoryId,
        accessToken,
        group.id,
        db,
        tenantId,
      );
    }

    if (
      groups.length < count ||
      startIndex + groups.length > response.totalResults
    ) {
      hasMore = false;
    } else {
      startIndex += groups.length;
    }
  }

  return { created, updated, total };
}

async function syncGroupMemberships(
  directoryId: string,
  accessToken: string,
  scimGroupId: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  // Fetch full group resource to get member list
  const fullGroup = await scimGetGroup(directoryId, accessToken, scimGroupId);
  const members = fullGroup.members ?? [];

  // Resolve internal group ID
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, scimGroupId)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Clear existing memberships for this group
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  for (const member of members) {
    // member.value is the SCIM user ID (external_id in our DB)
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, member.value)
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
