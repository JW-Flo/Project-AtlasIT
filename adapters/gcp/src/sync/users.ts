import type { GcpIamMember, SyncResult } from "../types.js";
import { getProjectIamPolicy } from "../client.js";

/**
 * Parse IAM policy bindings into deduplicated members with their roles.
 * Member format: "user:alice@example.com", "serviceAccount:sa@proj.iam.gserviceaccount.com"
 */
function parseIamMembers(
  bindings: Array<{ role: string; members: string[] }>,
): GcpIamMember[] {
  const memberMap = new Map<string, GcpIamMember>();

  for (const binding of bindings) {
    for (const raw of binding.members) {
      const colonIdx = raw.indexOf(":");
      if (colonIdx === -1) continue;

      const typeStr = raw.slice(0, colonIdx);
      const email = raw.slice(colonIdx + 1);

      // Skip special members like "allUsers", "allAuthenticatedUsers"
      if (!email || email === "" || !email.includes("@")) continue;

      const memberType = typeStr as GcpIamMember["type"];
      if (!["user", "serviceAccount", "group", "domain", "deleted"].includes(memberType)) {
        continue;
      }

      const existing = memberMap.get(email);
      if (existing) {
        existing.roles.push(binding.role);
      } else {
        memberMap.set(email, {
          type: memberType,
          email,
          roles: [binding.role],
        });
      }
    }
  }

  return Array.from(memberMap.values());
}

export async function syncUsers(
  accessToken: string,
  projectId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const policy = await getProjectIamPolicy(projectId, accessToken);
  const members = parseIamMembers(policy.bindings);

  // Only sync user and serviceAccount types as directory users
  const syncableMembers = members.filter(
    (m) => m.type === "user" || m.type === "serviceAccount",
  );

  for (const member of syncableMembers) {
    const externalId = `${member.type}:${member.email}`;
    const displayName = member.email.split("@")[0];
    const department = member.type === "serviceAccount" ? "Service Accounts" : null;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, externalId)
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
        externalId,
        member.email,
        displayName,
        department,
        null, // GCP IAM has no title concept
        "active",
        JSON.stringify({ type: member.type, email: member.email, roles: member.roles }),
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
