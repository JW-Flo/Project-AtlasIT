import type { CanonicalUserProfile } from "@atlasit/shared/automation/types";

/**
 * Load a full CanonicalUserProfile from D1 for a given user.
 * Looks up by email or directory user ID, enriches with groups + app access.
 * Returns null if user not found in directory.
 */
export async function enrichUserProfile(
  db: D1Database,
  tenantId: string,
  lookup: { email?: string; userId?: string; externalId?: string },
): Promise<CanonicalUserProfile | null> {
  // 1. Load directory_users row — prefer email, then external_id, then internal id
  let lookupQuery: string;
  let lookupVal: string | undefined;
  if (lookup.email) {
    lookupQuery = "SELECT * FROM directory_users WHERE tenant_id = ? AND email = ? LIMIT 1";
    lookupVal = lookup.email;
  } else if (lookup.externalId) {
    lookupQuery = "SELECT * FROM directory_users WHERE tenant_id = ? AND external_id = ? LIMIT 1";
    lookupVal = lookup.externalId;
  } else {
    lookupQuery = "SELECT * FROM directory_users WHERE tenant_id = ? AND id = ? LIMIT 1";
    lookupVal = lookup.userId;
  }
  const row = await db
    .prepare(lookupQuery)
    .bind(tenantId, lookupVal)
    .first<Record<string, unknown>>();

  if (!row) return null;

  const raw = safeJsonParse<Record<string, unknown>>(
    row.raw_attributes as string,
    {},
  );

  // 2. Normalize IdP-specific raw_attributes
  const firstName = (raw.firstName ??
    raw.givenName ??
    (raw as any)?.name?.givenName) as string | undefined;
  const lastName = (raw.lastName ??
    raw.familyName ??
    (raw as any)?.name?.familyName) as string | undefined;
  const phone = (raw.mobilePhone ?? raw.phone) as string | undefined;
  const manager = (raw.manager ?? raw.managerEmail) as string | undefined;
  const location = (raw.city ?? raw.orgUnitPath) as string | undefined;
  const orgUnit = (raw.orgUnitPath ?? raw.department) as string | undefined;

  // 3. Load group memberships
  const { results: memberRows } = await db
    .prepare(
      `SELECT dg.id as groupId, dg.name as groupName
       FROM directory_memberships dm
       JOIN directory_groups dg ON dg.id = dm.group_id
       WHERE dm.user_id = ? AND dm.tenant_id = ?`,
    )
    .bind(row.id, tenantId)
    .all<{ groupId: string; groupName: string }>();

  const groups = (memberRows ?? []).map((r) => r.groupName);
  const groupIds = (memberRows ?? []).map((r) => r.groupId);

  // 4. Load app access from group_app_mappings (legacy) + role_app_entitlements (new)
  let appAccess: CanonicalUserProfile["appAccess"] = [];
  const seenApps = new Set<string>();

  // 4a. Role-based entitlements (primary — if roles are configured)
  try {
    const { getUserRoleIds, resolveRoleEntitlements } = await import("@atlasit/shared");
    const roleIds = await getUserRoleIds(db, tenantId, row.id as string, groupIds);
    if (roleIds.length > 0) {
      const entitlements = await resolveRoleEntitlements(db, tenantId, roleIds);
      for (const ent of entitlements) {
        seenApps.add(ent.appId);
        appAccess.push({
          appId: ent.appId,
          role: ent.appRole,
          groupId: ent.fromRoleId,
        });
      }
    }
  } catch {
    // roles tables may not exist yet — fall through to legacy
  }

  // 4b. Legacy group_app_mappings (backward compat — fills gaps not covered by roles)
  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(",");
    const { results: mappingRows } = await db
      .prepare(
        `SELECT app_id as appId, role, group_id as groupId
         FROM group_app_mappings
         WHERE tenant_id = ? AND group_id IN (${placeholders})`,
      )
      .bind(tenantId, ...groupIds)
      .all<{ appId: string; role: string; groupId: string }>();

    for (const mapping of mappingRows ?? []) {
      if (!seenApps.has(mapping.appId)) {
        seenApps.add(mapping.appId);
        appAccess.push(mapping);
      }
    }
  }

  return {
    id: row.id as string,
    externalId: row.external_id as string,
    email: row.email as string,
    displayName:
      (row.display_name as string) ??
      `${firstName ?? ""} ${lastName ?? ""}`.trim(),
    status: row.status as CanonicalUserProfile["status"],
    source: (row.source as string) ?? "unknown",
    tenantId,
    firstName,
    lastName,
    phone,
    department: (row.department as string) ?? (raw.department as string),
    title: (row.title as string) ?? (raw.title as string),
    manager,
    location,
    orgUnit,
    groups,
    appAccess,
    rawAttributes: raw,
  };
}

function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}
