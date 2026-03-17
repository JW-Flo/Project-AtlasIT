import type { CrowdStrikeHostGroup, SyncResult } from "../types.js";
import {
  authenticate,
  listHostGroupIds,
  getHostGroupDetails,
  listHostGroupMembers,
} from "../client.js";

/**
 * Sync CrowdStrike host groups into directory_groups and directory_memberships.
 * Host groups contain devices, so memberships link group -> device entries in directory_users.
 */
export async function syncGroups(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const accessToken = await authenticate(clientId, clientSecret, baseUrl);

  const groupIds = await listHostGroupIds(accessToken, baseUrl);
  const groups = await getHostGroupDetails(groupIds, accessToken, baseUrl);

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
      .bind(
        existing?.id ?? null,
        tenantId,
        group.id,
        group.name,
        group.description ?? null,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync memberships for this host group
    await syncGroupMemberships(accessToken, baseUrl, group, db, tenantId);
  }

  return { created, updated, total };
}

async function syncGroupMemberships(
  accessToken: string,
  baseUrl: string,
  group: CrowdStrikeHostGroup,
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

  // Remove stale memberships for this group before re-inserting
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  const memberDeviceIds = await listHostGroupMembers(
    group.id,
    accessToken,
    baseUrl,
  );

  for (const deviceId of memberDeviceIds) {
    // Look up the device entry in directory_users (stored with "device:" prefix)
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, `device:${deviceId}`)
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
