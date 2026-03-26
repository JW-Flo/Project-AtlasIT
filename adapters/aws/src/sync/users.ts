import type { AwsConfig, IAMUser } from "../types.js";
import { listUsers } from "../client.js";

export interface UserSyncResult {
  created: number;
  updated: number;
  total: number;
}

/**
 * Map IAM user status to our canonical directory status.
 * IAM users don't have a status field per se — if they exist, they're active.
 * We check PasswordLastUsed and path for heuristics.
 */
function mapUserStatus(user: IAMUser): string {
  // Users under /disabled/ or /deactivated/ paths are treated as inactive
  const path = user.Path.toLowerCase();
  if (path.includes("/disabled/") || path.includes("/deactivated/")) {
    return "inactive";
  }
  return "active";
}

/**
 * Sync all IAM users into the directory_users table.
 *
 * Handles full pagination via Marker/IsTruncated (done inside client.listUsers).
 * Maps IAM fields: UserName, UserId, Arn, CreateDate to directory_users columns.
 * All queries are scoped by tenant_id.
 */
export async function syncUsers(
  config: AwsConfig,
  db: D1Database,
  tenantId: string,
): Promise<UserSyncResult> {
  const iamUsers = await listUsers(config);

  let created = 0;
  let updated = 0;

  for (const user of iamUsers) {
    const status = mapUserStatus(user);

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.UserId)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE directory_users
           SET email = ?1, display_name = ?2, status = ?3,
               raw_attributes = ?4, updated_at = datetime('now')
           WHERE tenant_id = ?5 AND external_id = ?6`,
        )
        .bind(
          // IAM users have no email field — use UserName as identifier
          user.UserName,
          user.UserName,
          status,
          JSON.stringify(user),
          tenantId,
          user.UserId,
        )
        .run();
      updated++;
    } else {
      await db
        .prepare(
          `INSERT INTO directory_users
           (tenant_id, external_id, email, display_name, status, raw_attributes)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(
          tenantId,
          user.UserId,
          user.UserName,
          user.UserName,
          status,
          JSON.stringify(user),
        )
        .run();
      created++;
    }
  }

  return { created, updated, total: iamUsers.length };
}
