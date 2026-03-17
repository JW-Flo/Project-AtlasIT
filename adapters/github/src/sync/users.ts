import type { GitHubUser, SyncResult } from "../types.js";
import { listOrgMembers, getUser } from "../client.js";

export async function syncUsers(
  accessToken: string,
  org: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const members = await listOrgMembers(org, accessToken);

  for (const member of members) {
    // GitHub org member listing returns minimal user data (no email/name).
    // Fetch full profile to get email and display name.
    let email: string | null = null;
    let displayName: string | null = null;

    try {
      const fullUser = await getUser(member.login, accessToken);
      email = fullUser.email;
      displayName = fullUser.name;
    } catch {
      // Fall back to login-based values if user fetch fails
    }

    // Use login as fallback email (GitHub does not guarantee public email)
    const resolvedEmail = email ?? `${member.login}@users.noreply.github.com`;
    const resolvedName = displayName ?? member.login;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, String(member.id))
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        String(member.id),
        resolvedEmail,
        resolvedName,
        null, // GitHub has no department concept
        null, // GitHub has no title concept
        "active",
        JSON.stringify(member),
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;
  }

  return { created, updated, total };
}
