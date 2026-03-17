import type { QuickBooksCustomer, SyncResult } from "../types.js";
import { listCustomers } from "../client.js";

export async function syncGroups(
  realmId: string,
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  // In QuickBooks, Customers are treated as organizations/groups in the directory context
  const customers = await listCustomers(realmId, accessToken);

  for (const customer of customers) {
    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, customer.Id)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        customer.Id,
        customer.DisplayName,
        customer.BillAddr?.City ?? null,
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
