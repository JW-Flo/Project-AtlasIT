import type { SyncResult } from "../types.js";
import { listOrganizations, getOrganizationMembers } from "../client.js";

export async function syncGroups(
  accessToken: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const organizations = await listOrganizations(domain, accessToken);

  for (const org of organizations) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, org.id)
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
        org.id,
        org.name,
        org.display_name ?? null,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;

    await syncOrganizationMembers(accessToken, org.id, domain, db, tenantId);
  }

  return { created, updated, total };
}

async function syncOrganizationMembers(
  accessToken: string,
  orgId: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, orgId)
    .first<{ id: string }>();

  if (!groupRow) return;

  // Remove stale memberships before re-inserting
  await db
    .prepare(
      "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
    )
    .bind(tenantId, groupRow.id)
    .run();

  let members;
  try {
    members = await getOrganizationMembers(domain, orgId, accessToken);
  } catch (err) {
    // 404 means no members or org not found — skip gracefully
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404")) return;
    throw err;
  }

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
