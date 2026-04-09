/**
 * Role types for identity-grounded lifecycle management.
 *
 * Roles bundle app entitlements and can be assigned to users or groups.
 * They support hierarchy (org → department → team) via parent_id.
 */

export type RoleScopeLevel = "org" | "department" | "team";

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: RoleScopeLevel;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleAppEntitlement {
  id: string;
  tenantId: string;
  roleId: string;
  appId: string;
  appRole: string;
  createdAt: string;
}

export interface RoleAssignment {
  id: string;
  tenantId: string;
  roleId: string;
  targetType: "user" | "group";
  targetId: string;
  createdAt: string;
}

export interface RoleWithEntitlements extends Role {
  entitlements: RoleAppEntitlement[];
  assignmentCount: number;
}

export interface ResolvedEntitlement {
  appId: string;
  appRole: string;
  fromRoleId: string;
  fromRoleName: string;
  inherited: boolean;
}

/**
 * Resolve all app entitlements for a set of role IDs, including inherited
 * entitlements from parent roles up the hierarchy chain.
 */
export async function resolveRoleEntitlements(
  db: any,
  tenantId: string,
  roleIds: string[],
): Promise<ResolvedEntitlement[]> {
  if (roleIds.length === 0) return [];

  // Load all roles for this tenant (typically <50, so full load is fine)
  const { results: allRoles } = await db
    .prepare("SELECT id, name, parent_id FROM roles WHERE tenant_id = ?")
    .bind(tenantId)
    .all();

  const roleMap = new Map<string, { id: string; name: string; parentId: string | null }>();
  for (const r of (allRoles ?? []) as Array<{ id: string; name: string; parent_id: string | null }>) {
    roleMap.set(r.id, { id: r.id, name: r.name, parentId: r.parent_id });
  }

  // Walk up hierarchy to collect all role IDs (including inherited)
  const allRoleIds = new Set<string>();
  const roleChains = new Map<string, string[]>(); // roleId → chain of ancestor IDs

  for (const roleId of roleIds) {
    const chain: string[] = [];
    let current: string | null = roleId;
    const visited = new Set<string>();

    while (current && !visited.has(current)) {
      visited.add(current);
      allRoleIds.add(current);
      chain.push(current);
      const role = roleMap.get(current);
      current = role?.parentId ?? null;
    }

    roleChains.set(roleId, chain);
  }

  if (allRoleIds.size === 0) return [];

  // Fetch entitlements for all roles in the hierarchy
  const placeholders = Array.from(allRoleIds).map(() => "?").join(",");
  const { results: entitlementRows } = await db
    .prepare(
      `SELECT role_id, app_id, app_role FROM role_app_entitlements
       WHERE tenant_id = ? AND role_id IN (${placeholders})`,
    )
    .bind(tenantId, ...allRoleIds)
    .all();

  // Deduplicate by appId (direct assignment wins over inherited)
  const directRoleIds = new Set(roleIds);
  const entitlements: ResolvedEntitlement[] = [];
  const seen = new Set<string>();

  for (const row of (entitlementRows ?? []) as Array<{ role_id: string; app_id: string; app_role: string }>) {
    if (seen.has(row.app_id)) continue;
    seen.add(row.app_id);

    const role = roleMap.get(row.role_id);
    entitlements.push({
      appId: row.app_id,
      appRole: row.app_role,
      fromRoleId: row.role_id,
      fromRoleName: role?.name ?? row.role_id,
      inherited: !directRoleIds.has(row.role_id),
    });
  }

  return entitlements;
}

/**
 * Get all role IDs assigned to a user (directly and via group membership).
 */
export async function getUserRoleIds(
  db: any,
  tenantId: string,
  userId: string,
  groupIds: string[],
): Promise<string[]> {
  const roleIds = new Set<string>();

  // Direct user assignments
  const { results: directRoles } = await db
    .prepare(
      "SELECT role_id FROM role_assignments WHERE tenant_id = ? AND target_type = 'user' AND target_id = ?",
    )
    .bind(tenantId, userId)
    .all();

  for (const r of (directRoles ?? []) as Array<{ role_id: string }>) {
    roleIds.add(r.role_id);
  }

  // Group-based assignments
  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(",");
    const { results: groupRoles } = await db
      .prepare(
        `SELECT role_id FROM role_assignments
         WHERE tenant_id = ? AND target_type = 'group' AND target_id IN (${placeholders})`,
      )
      .bind(tenantId, ...groupIds)
      .all();

    for (const r of (groupRoles ?? []) as Array<{ role_id: string }>) {
      roleIds.add(r.role_id);
    }
  }

  return [...roleIds];
}
