import type { QuickBooksEmployee, SyncResult } from "../types.js";
import { listEmployees } from "../client.js";

export async function syncUsers(
  realmId: string,
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const employees = await listEmployees(realmId, accessToken);

  for (const employee of employees) {
    // Resolve email — use PrimaryEmailAddr
    const email =
      employee.PrimaryEmailAddr?.Address ||
      `${employee.DisplayName.replace(/\s+/g, ".").toLowerCase()}@quickbooks.local`;

    // Extract display name
    const displayName = employee.DisplayName;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, employee.Id)
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
        employee.Id,
        email,
        displayName,
        null, // QuickBooks doesn't have department in standard fields
        null, // QuickBooks doesn't have job title in Employee object
        employee.Active ? "active" : "inactive",
        JSON.stringify(employee),
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
