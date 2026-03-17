import type { DiscordRole, SyncResult } from "../types.js";
import { listGuildRoles, listGuildMembers } from "../client.js";

export async function syncGroups(
  botToken: string,
  guildId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const roles = await listGuildRoles(guildId, botToken);

  // Filter out @everyone role (always id == guildId)
  const syncableRoles = roles.filter((r) => r.id !== guildId);

  for (const role of syncableRoles) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, role.id)
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
        role.id,
        role.name,
        null, // Discord roles have no description field
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync role memberships
    await syncRoleMemberships(botToken, guildId, role, db, tenantId);
  }

  return { created, updated, total };
}

async function syncRoleMemberships(
  botToken: string,
  guildId: string,
  role: DiscordRole,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, role.id)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships for this role
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  // Get all members and filter those with this role
  const members = await listGuildMembers(guildId, botToken);

  for (const member of members) {
    if (!member.user || !member.roles.includes(role.id)) continue;

    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, member.user.id)
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
