import type { SalesforceGroup, SyncResult } from "../types.js";
import { listGroups, getGroupMembers, getUser } from "../client.js";

interface SalesforceConfig {
  instanceUrl: string;
}

export async function syncGroups(
  accessToken: string,
  config: SalesforceConfig,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const groups = await listGroups(config, accessToken);

  for (const group of groups) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, group.Id)
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
        group.Id,
        group.Name,
        group.Description ?? null,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync memberships for this group
    await syncGroupMemberships(accessToken, config, group, db, tenantId);
  }

  return { created, updated, total };
}

async function syncGroupMemberships(
  accessToken: string,
  config: SalesforceConfig,
  group: SalesforceGroup,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, group.Id)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships for this group before re-inserting
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  const members = await getGroupMembers(config, group.Id, accessToken);

  for (const member of members) {
    // Try to fetch user details if UserOrGroupId is a user
    try {
      const user = await getUser(config, member.UserOrGroupId, accessToken);
      const userRow = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.Id)
        .first<{ id: string }>();

      if (userRow) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO directory_memberships (tenant_id, user_id, group_id)
             VALUES (?, ?, ?)`,
          )
          .bind(tenantId, userRow.id, groupRow.id)
          .run();
      }
    } catch {
      // Not a user (might be another group), skip
    }
  }
}
