import type { NotionDatabase, SyncResult } from "../types.js";
import { listDatabases } from "../client.js";

export async function syncGroups(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const databases = await listDatabases(accessToken);

  for (const db_item of databases) {
    // Extract title from Notion's complex title structure
    let title = "Untitled Database";
    if (db_item.title && Array.isArray(db_item.title)) {
      const titlePart = db_item.title.find((t) => t.text?.content);
      if (titlePart?.text?.content) {
        title = titlePart.text.content;
      }
    }

    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, db_item.id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(existing?.id ?? null, tenantId, db_item.id, title, null)
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
