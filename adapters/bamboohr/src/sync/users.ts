import type { BambooHREmployee, SyncResult } from "../types.js";
import { listEmployees } from "../client.js";

export async function syncUsers(
  subdomain: string,
  apiKey: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const employees = await listEmployees(subdomain, apiKey);

  for (const employee of employees) {
    // Resolve email — use workEmail, then personalEmail, then fallback
    const email =
      employee.workEmail ||
      employee.personalEmail ||
      employee.email ||
      `${employee.firstName}.${employee.lastName}@bamboohr.local`;

    // Resolve display name
    const displayName = `${employee.firstName} ${employee.lastName}`;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, employee.id)
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
        employee.id,
        email,
        displayName,
        employee.department ?? null,
        employee.jobTitle ?? null,
        employee.status === "Active" ? "active" : "inactive",
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
