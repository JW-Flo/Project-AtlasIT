import type { XeroContact, SyncResult } from "../types.js";
import { listContacts } from "../client.js";

export async function syncGroups(
  accessToken: string,
  tenantId: string,
  db: D1Database,
  atlastenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  // In Xero, Contacts are treated as organizations/groups in the directory context
  const contacts = await listContacts(accessToken, tenantId);

  for (const contact of contacts) {
    // Only sync active contacts
    if (contact.Status !== "ACTIVE") {
      continue;
    }

    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(atlastenantId, contact.ContactID)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        atlastenantId,
        contact.ContactID,
        contact.Name,
        contact.EmailAddress ?? null,
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
