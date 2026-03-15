import type { OktaUser, OktaGroup, SyncResult } from "./types.js";
import { listUsers, listGroups, listGroupMembers } from "./client.js";

function mapOktaStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: "active",
    STAGED: "pending",
    PROVISIONED: "pending",
    RECOVERY: "inactive",
    PASSWORD_EXPIRED: "active",
    LOCKED_OUT: "suspended",
    SUSPENDED: "suspended",
    DEPROVISIONED: "inactive",
  };
  return statusMap[status] ?? "inactive";
}

async function upsertUsers(
  db: D1Database,
  tenantId: string,
  users: OktaUser[],
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const user of users) {
    const displayName =
      user.profile.displayName ??
      `${user.profile.firstName} ${user.profile.lastName}`.trim();

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ?1 AND external_id = ?2",
      )
      .bind(tenantId, user.id)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_users
           SET email = ?1, display_name = ?2, department = ?3, title = ?4,
               status = ?5, raw_attributes = ?6, updated_at = datetime('now')
           WHERE tenant_id = ?7 AND external_id = ?8`,
        )
        .bind(
          user.profile.email,
          displayName,
          user.profile.department ?? null,
          user.profile.title ?? null,
          mapOktaStatus(user.status),
          JSON.stringify(user.profile),
          tenantId,
          user.id,
        )
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_users (tenant_id, external_id, email, display_name, department, title, status, raw_attributes)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          tenantId,
          user.id,
          user.profile.email,
          displayName,
          user.profile.department ?? null,
          user.profile.title ?? null,
          mapOktaStatus(user.status),
          JSON.stringify(user.profile),
        )
        .run();
      created++;
    }
  }

  return { created, updated };
}

async function upsertGroups(
  db: D1Database,
  tenantId: string,
  groups: OktaGroup[],
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const group of groups) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ?1 AND external_id = ?2",
      )
      .bind(tenantId, group.id)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_groups
           SET name = ?1, description = ?2, updated_at = datetime('now')
           WHERE tenant_id = ?3 AND external_id = ?4`,
        )
        .bind(
          group.profile.name,
          group.profile.description ?? null,
          tenantId,
          group.id,
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
          group.id,
          group.profile.name,
          group.profile.description ?? null,
        )
        .run();
      created++;
    }
  }

  return { created, updated };
}

async function syncMemberships(
  db: D1Database,
  tenantId: string,
  orgUrl: string,
  apiToken: string,
  groups: OktaGroup[],
): Promise<void> {
  // Clear existing memberships for this tenant
  await db
    .prepare("DELETE FROM directory_memberships WHERE tenant_id = ?1")
    .bind(tenantId)
    .run();

  for (const group of groups) {
    const members = await listGroupMembers(orgUrl, apiToken, group.id);

    // Resolve internal IDs
    const dbGroup = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ?1 AND external_id = ?2",
      )
      .bind(tenantId, group.id)
      .first<{ id: string }>();

    if (!dbGroup) continue;

    for (const member of members) {
      const dbUser = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ?1 AND external_id = ?2",
        )
        .bind(tenantId, member.id)
        .first<{ id: string }>();

      if (!dbUser) continue;

      await db
        .prepare(
          `INSERT OR IGNORE INTO directory_memberships (tenant_id, user_id, group_id)
           VALUES (?1, ?2, ?3)`,
        )
        .bind(tenantId, dbUser.id, dbGroup.id)
        .run();
    }
  }
}

async function updateConnectionStatus(
  db: D1Database,
  tenantId: string,
  userCount: number,
  groupCount: number,
  error?: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM directory_connections WHERE tenant_id = ?1")
    .bind(tenantId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_connections
         SET status = ?1, error_msg = ?2, last_sync_at = datetime('now'),
             user_count = ?3, group_count = ?4, updated_at = datetime('now')
         WHERE tenant_id = ?5`,
      )
      .bind(
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
        tenantId,
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO directory_connections (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, ?6)`,
      )
      .bind(
        tenantId,
        "okta",
        error ? "error" : "active",
        error ?? null,
        userCount,
        groupCount,
      )
      .run();
  }
}

export async function syncDirectory(
  db: D1Database,
  orgUrl: string,
  apiToken: string,
  tenantId: string,
): Promise<SyncResult> {
  try {
    const [oktaUsers, oktaGroups] = await Promise.all([
      listUsers(orgUrl, apiToken),
      listGroups(orgUrl, apiToken),
    ]);

    const userResult = await upsertUsers(db, tenantId, oktaUsers);
    const groupResult = await upsertGroups(db, tenantId, oktaGroups);
    await syncMemberships(db, tenantId, orgUrl, apiToken, oktaGroups);
    await updateConnectionStatus(
      db,
      tenantId,
      oktaUsers.length,
      oktaGroups.length,
    );

    return {
      users: { ...userResult, total: oktaUsers.length },
      groups: { ...groupResult, total: oktaGroups.length },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    await updateConnectionStatus(db, tenantId, 0, 0, errorMsg);
    throw err;
  }
}
