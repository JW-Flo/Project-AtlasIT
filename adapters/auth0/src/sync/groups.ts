import type { Auth0Organization, Auth0Member, SyncResult } from "../types.js";

const API_BASE = "https://{domain}/api/v2";

export async function syncGroups(
  accessToken: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;
  let page = 0;
  const perPage = 50;

  do {
    const url = new URL(
      `${API_BASE.replace("{domain}", domain)}/organizations`,
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("include_totals", "true");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Auth0 API organizations request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      organizations?: Auth0Organization[];
    };

    const organizations = data.organizations ?? [];

    for (const org of organizations) {
      const existing = await db
        .prepare(
          "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, org.id)
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
          org.id,
          org.name,
          org.display_name ?? null,
        )
        .run();

      if (existing) {
        updated++;
      } else {
        created++;
      }
      total++;

      await syncOrganizationMembers(accessToken, org.id, domain, db, tenantId);
    }

    if (organizations.length < perPage) break;
    page++;
  } while (true);

  return { created, updated, total };
}

async function syncOrganizationMembers(
  accessToken: string,
  orgId: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<void> {
  let page = 0;
  const perPage = 50;

  const groupRow = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, orgId)
    .first<{ id: string }>();

  if (!groupRow) return;

  do {
    const url = new URL(
      `${API_BASE.replace("{domain}", domain)}/organizations/${encodeURIComponent(orgId)}/members`,
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("include_totals", "true");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) return;
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Auth0 API members request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      members?: Auth0Member[];
    };

    const members = data.members ?? [];

    for (const member of members) {
      const userRow = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, member.user_id)
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

    if (members.length < perPage) break;
    page++;
  } while (true);
}
