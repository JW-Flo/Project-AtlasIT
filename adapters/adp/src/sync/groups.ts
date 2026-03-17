import type { ADPDepartment, ADPWorker, SyncResult } from "../types.js";
import { listAllDepartments, listAllWorkers } from "../client.js";

export async function syncGroups(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const departments = await listAllDepartments(accessToken);

  for (const dept of departments) {
    const externalId = dept.departmentCode.codeValue;
    const name =
      dept.longName ??
      dept.shortName ??
      dept.departmentCode.shortName ??
      externalId;
    const description = dept.longName ?? null;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, externalId)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_groups
         (id, tenant_id, external_id, name, description, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        externalId,
        name,
        description,
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;
  }

  // Sync memberships: associate workers to their departments
  await syncDepartmentMemberships(accessToken, db, tenantId);

  return { created, updated, total };
}

/**
 * Assign each worker to their department group via directory_memberships.
 * Reads the primary work assignment's homeOrganizationalUnit to determine
 * which department a worker belongs to.
 */
async function syncDepartmentMemberships(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  const workers = await listAllWorkers(accessToken);

  // Build a map of department code -> group row id
  const groupRows = await db
    .prepare(
      "SELECT id, external_id FROM directory_groups WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .all<{ id: string; external_id: string }>();

  const groupMap = new Map<string, string>();
  for (const row of groupRows.results) {
    groupMap.set(row.external_id, row.id);
  }

  // Clear existing memberships for this tenant to rebuild
  // Delete only department-based memberships (groups that exist in our group map)
  for (const groupId of groupMap.values()) {
    await db
      .prepare(
        "DELETE FROM directory_memberships WHERE tenant_id = ? AND group_id = ?",
      )
      .bind(tenantId, groupId)
      .run();
  }

  for (const worker of workers) {
    const primary = worker.workAssignments?.find((a) => a.primaryIndicator);
    const deptCode =
      primary?.homeOrganizationalUnit?.nameCode?.codeValue;

    if (!deptCode) continue;

    const groupId = groupMap.get(deptCode);
    if (!groupId) continue;

    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, worker.associateOID)
      .first<{ id: string }>();

    if (!userRow) continue;

    await db
      .prepare(
        `INSERT OR IGNORE INTO directory_memberships (tenant_id, user_id, group_id)
         VALUES (?, ?, ?)`,
      )
      .bind(tenantId, userRow.id, groupId)
      .run();
  }
}
