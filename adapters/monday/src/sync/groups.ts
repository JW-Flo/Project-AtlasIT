import type { MondayTeam, SyncResult } from "../types.js";
import { listTeams } from "../client.js";

export async function syncGroups(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const teams = await listTeams(accessToken);

  for (const team of teams) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, team.id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(existing?.id ?? null, tenantId, team.id, team.name, null)
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    // Sync memberships for this team
    await syncTeamMemberships(team, db, tenantId);
  }

  return { created, updated, total };
}

async function syncTeamMemberships(
  team: MondayTeam,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, team.id)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships for this group before re-inserting
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  // Add team members
  const members = team.users || [];

  for (const member of members) {
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
