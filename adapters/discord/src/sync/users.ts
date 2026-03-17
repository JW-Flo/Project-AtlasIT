import type { DiscordMember, SyncResult } from "../types.js";
import { listGuildMembers } from "../client.js";

export async function syncUsers(
  botToken: string,
  guildId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const members = await listGuildMembers(guildId, botToken);

  for (const member of members) {
    if (!member.user) continue; // Skip members without user data

    const user = member.user;

    // Discord discriminator is deprecated; use username#0 format if needed
    // For now, use email if available, otherwise construct Discord-style
    const email = user.email ?? `${user.id}@discord.internal`;
    const displayName = user.username ?? `user_${user.id}`;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        user.id,
        email,
        displayName,
        null, // Discord has no department concept
        null, // Discord has no title concept
        "active",
        JSON.stringify(user),
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
