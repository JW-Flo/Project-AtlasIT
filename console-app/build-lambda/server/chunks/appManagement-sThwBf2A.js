function getEnv(platform) {
  return platform?.env || {};
}
async function listGroupAssignments(platform, tenantId, appId) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return [];
  const result = await db.prepare(
    "SELECT id, app_id, group_id, group_name, created_at FROM app_group_assignments WHERE tenant_id = ?1 AND app_id = ?2 ORDER BY created_at"
  ).bind(tenantId, appId).all();
  return result.results || [];
}
async function upsertGroupAssignment(platform, tenantId, appId, groupId, groupName) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false, error: "Database not available" };
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO app_group_assignments (id, tenant_id, app_id, group_id, group_name)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, app_id, group_id) DO UPDATE SET group_name = excluded.group_name`
  ).bind(id, tenantId, appId, groupId, groupName).run();
  return { ok: true };
}
async function deleteGroupAssignment(platform, tenantId, appId, groupId) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false };
  await db.prepare(
    "DELETE FROM app_group_assignments WHERE tenant_id = ?1 AND app_id = ?2 AND group_id = ?3"
  ).bind(tenantId, appId, groupId).run();
  return { ok: true };
}
async function listRoleMappings(platform, tenantId, appId) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return [];
  const result = await db.prepare(
    "SELECT id, app_id, source_role, target_role, created_at FROM app_role_mappings WHERE tenant_id = ?1 AND app_id = ?2 ORDER BY created_at"
  ).bind(tenantId, appId).all();
  return result.results || [];
}
async function upsertRoleMapping(platform, tenantId, appId, sourceRole, targetRole) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false, error: "Database not available" };
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO app_role_mappings (id, tenant_id, app_id, source_role, target_role)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, app_id, source_role) DO UPDATE SET target_role = excluded.target_role`
  ).bind(id, tenantId, appId, sourceRole, targetRole).run();
  return { ok: true };
}
async function deleteRoleMapping(platform, tenantId, appId, sourceRole) {
  const { ATLAS_SHARED_DB: db } = getEnv(platform);
  if (!db) return { ok: false };
  await db.prepare(
    "DELETE FROM app_role_mappings WHERE tenant_id = ?1 AND app_id = ?2 AND source_role = ?3"
  ).bind(tenantId, appId, sourceRole).run();
  return { ok: true };
}

export { listRoleMappings as a, upsertRoleMapping as b, deleteRoleMapping as c, deleteGroupAssignment as d, listGroupAssignments as l, upsertGroupAssignment as u };
//# sourceMappingURL=appManagement-sThwBf2A.js.map
