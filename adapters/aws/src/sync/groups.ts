import type { AwsConfig, IAMGroup } from "../types.js";
import { listGroups, listGroupMembers } from "../client.js";

export interface GroupSyncResult {
  created: number;
  updated: number;
  total: number;
}

/**
 * Sync all IAM groups into directory_groups and their memberships into
 * directory_memberships.
 *
 * Flow:
 *   1. List all IAM groups (paginated via client)
 *   2. Upsert each group into directory_groups
 *   3. For each group, list members and upsert into directory_memberships
 *
 * All queries are scoped by tenant_id.
 */
export async function syncGroups(
  config: AwsConfig,
  db: D1Database,
  tenantId: string,
): Promise<GroupSyncResult> {
  const iamGroups = await listGroups(config);

  let created = 0;
  let updated = 0;

  for (const group of iamGroups) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, group.GroupId)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_groups
           SET name = ?1, description = ?2, updated_at = datetime('now')
           WHERE tenant_id = ?3 AND external_id = ?4`,
        )
        .bind(
          group.GroupName,
          `IAM Group: ${group.Arn}`,
          tenantId,
          group.GroupId,
        )
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_groups (tenant_id, external_id, name, description)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(
          tenantId,
          group.GroupId,
          group.GroupName,
          `IAM Group: ${group.Arn}`,
        )
        .run();
      created++;
    }

    // Sync memberships for this group
    await syncGroupMemberships(config, group, db, tenantId);
  }

  return { created, updated, total: iamGroups.length };
}

/**
 * Sync membership relationships for a single IAM group.
 *
 * Clears existing memberships for this group (scoped by tenant_id) then
 * re-inserts current members. This ensures removed members are reflected.
 */
async function syncGroupMemberships(
  config: AwsConfig,
  group: IAMGroup,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  // Look up internal group ID
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, group.GroupId)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Clear existing memberships for this specific group
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  // Fetch current members from AWS
  const members = await listGroupMembers(config, group.GroupName);

  for (const member of members) {
    // Look up internal user ID by external_id (UserId)
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, member.UserId)
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
