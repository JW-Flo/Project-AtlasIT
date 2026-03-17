import type { WorkdayWorker, SyncResult } from "../types.js";
import { listWorkers } from "../client.js";

export async function syncUsers(
  accessToken: string,
  tenantUrl: string,
  tenantName: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const workers = await listWorkers(tenantUrl, tenantName, accessToken);

  for (const worker of workers) {
    const email = worker.primaryWorkEmail;
    const displayName = worker.descriptor;
    const department =
      worker.supervisoryOrganization?.descriptor ?? null;
    const title = worker.businessTitle ?? null;
    const status = worker.isActive ? "active" : "inactive";

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, worker.id)
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
        worker.id,
        email,
        displayName,
        department,
        title,
        status,
        JSON.stringify(worker),
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
