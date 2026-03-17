import type { HubSpotContact, SyncResult } from "../types.js";
import { listContacts } from "../client.js";

export async function syncUsers(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const contacts = await listContacts(accessToken);

  for (const contact of contacts) {
    const email =
      contact.properties.email ?? `contact_${contact.id}@hubspot.local`;
    const firstName = contact.properties.firstname ?? "";
    const lastName = contact.properties.lastname ?? "";
    const displayName = `${firstName} ${lastName}`.trim() || email;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, contact.id)
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
        contact.id,
        email,
        displayName,
        contact.properties.company ?? null,
        contact.properties.jobtitle ?? null,
        contact.archived ? "inactive" : "active",
        JSON.stringify(contact),
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
