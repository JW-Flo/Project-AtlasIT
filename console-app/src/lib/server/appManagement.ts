/**
 * App management: group assignments and role mappings backed by D1.
 */

interface Env {
  ATLAS_SHARED_DB?: D1Database;
}

function getEnv(platform: any): Env {
  return (platform?.env as Env) || {};
}

// ---------------------------------------------------------------------------
// Group Assignments
// ---------------------------------------------------------------------------

export interface GroupAssignment {
  id: string;
  app_id: string;
  group_id: string;
  group_name: string;
  created_at: string;
}

export async function listGroupAssignments(
  platform: any,
  tenantId: string,
  appId: string,
): Promise<GroupAssignment[]> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return [];
  const result = await db
    .prepare(
      "SELECT id, app_id, group_id, group_name, created_at FROM app_group_assignments WHERE tenant_id = ?1 AND app_id = ?2 ORDER BY created_at",
    )
    .bind(tenantId, appId)
    .all<GroupAssignment>();
  return result.results || [];
}

export async function upsertGroupAssignment(
  platform: any,
  tenantId: string,
  appId: string,
  groupId: string,
  groupName: string,
): Promise<{ ok: boolean; error?: string }> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false, error: "Database not available" };
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO app_group_assignments (id, tenant_id, app_id, group_id, group_name)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, app_id, group_id) DO UPDATE SET group_name = excluded.group_name`,
    )
    .bind(id, tenantId, appId, groupId, groupName)
    .run();
  return { ok: true };
}

export async function deleteGroupAssignment(
  platform: any,
  tenantId: string,
  appId: string,
  groupId: string,
): Promise<{ ok: boolean }> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false };
  await db
    .prepare(
      "DELETE FROM app_group_assignments WHERE tenant_id = ?1 AND app_id = ?2 AND group_id = ?3",
    )
    .bind(tenantId, appId, groupId)
    .run();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Role Mappings
// ---------------------------------------------------------------------------

export interface RoleMapping {
  id: string;
  app_id: string;
  source_role: string;
  target_role: string;
  created_at: string;
}

export async function listRoleMappings(
  platform: any,
  tenantId: string,
  appId: string,
): Promise<RoleMapping[]> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return [];
  const result = await db
    .prepare(
      "SELECT id, app_id, source_role, target_role, created_at FROM app_role_mappings WHERE tenant_id = ?1 AND app_id = ?2 ORDER BY created_at",
    )
    .bind(tenantId, appId)
    .all<RoleMapping>();
  return result.results || [];
}

export async function upsertRoleMapping(
  platform: any,
  tenantId: string,
  appId: string,
  sourceRole: string,
  targetRole: string,
): Promise<{ ok: boolean; error?: string }> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false, error: "Database not available" };
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO app_role_mappings (id, tenant_id, app_id, source_role, target_role)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, app_id, source_role) DO UPDATE SET target_role = excluded.target_role`,
    )
    .bind(id, tenantId, appId, sourceRole, targetRole)
    .run();
  return { ok: true };
}

export async function deleteRoleMapping(
  platform: any,
  tenantId: string,
  appId: string,
  sourceRole: string,
): Promise<{ ok: boolean }> {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false };
  await db
    .prepare(
      "DELETE FROM app_role_mappings WHERE tenant_id = ?1 AND app_id = ?2 AND source_role = ?3",
    )
    .bind(tenantId, appId, sourceRole)
    .run();
  return { ok: true };
}
