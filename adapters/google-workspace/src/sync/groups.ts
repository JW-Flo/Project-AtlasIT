import type { GoogleGroup, GoogleMember, SyncResult } from "../types.js";

const ADMIN_API_BASE = "https://admin.googleapis.com/admin/directory/v1";

export async function syncGroups(
  accessToken: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;
  let pageToken: string | undefined;

  do {
    const url = new URL(`${ADMIN_API_BASE}/groups`);
    url.searchParams.set("domain", domain);
    url.searchParams.set("maxResults", "200");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Google Admin API groups request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      groups?: GoogleGroup[];
      nextPageToken?: string;
    };

    const groups = data.groups ?? [];

    for (const group of groups) {
      const existing = await db
        .prepare(
          "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, group.id)
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
          group.id,
          group.name,
          group.description ?? null,
        )
        .run();

      if (existing) {
        updated++;
      } else {
        created++;
      }
      total++;

      await syncGroupMemberships(accessToken, group.id, db, tenantId);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { created, updated, total };
}

async function syncGroupMemberships(
  accessToken: string,
  groupKey: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  let pageToken: string | undefined;

  // Look up internal group ID
  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, groupKey)
    .first<{ id: string }>();

  if (!groupRow) return;

  do {
    const url = new URL(
      `${ADMIN_API_BASE}/groups/${encodeURIComponent(groupKey)}/members`,
    );
    url.searchParams.set("maxResults", "200");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      // 404 means the group has no members
      if (response.status === 404) return;
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Google Admin API members request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      members?: GoogleMember[];
      nextPageToken?: string;
    };

    const members = data.members ?? [];

    for (const member of members) {
      if (member.type !== "USER") continue;

      // Look up internal user ID by external_id
      const userRow = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, member.id)
        .first<{ id: string }>();

      if (!userRow) continue;

      await db
        .prepare(
          `INSERT OR REPLACE INTO directory_memberships (tenant_id, user_id, group_id)
           VALUES (?, ?, ?)`,
        )
        .bind(tenantId, userRow.id, groupRow.id)
        .run();
    }

    pageToken = data.nextPageToken;
  } while (pageToken);
}
