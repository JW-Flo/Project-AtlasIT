import type { AzureGroup, AzureGroupMember, SyncResult } from "../types.js";
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
           SET name = ?1, description = ?2, updated_at = datetime('now')
           WHERE tenant_id = ?3 AND external_id = ?4`,
        )
        .bind(group.displayName, group.description ?? null, tenantId, group.id)
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_groups (tenant_id, external_id, name, description)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(tenantId, group.id, group.displayName, group.description ?? null)
        .run();
      created++;
    }

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

  // Clear existing memberships for this group within this tenant
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  let members: AzureGroupMember[];
  try {
    members = await getGroupMembers(accessToken, groupExternalId);
  } catch (err) {
    // 404 or permission issues on member listing are non-fatal
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "warn",
        message: "Failed to fetch group members",
        groupExternalId,
        tenantId,
        error: msg,
      }),
    );
    return;
  }

  for (const member of members) {
    // Only sync user-type members
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
