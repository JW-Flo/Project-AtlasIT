import type { Auth0User, SyncResult } from "../types.js";

const API_BASE = "https://{domain}/api/v2";

export async function syncUsers(
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
    const url = new URL(`${API_BASE.replace("{domain}", domain)}/users`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("include_totals", "true");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Auth0 API users request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      users?: Auth0User[];
      total?: number;
    };

    const users = data.users ?? [];

    for (const user of users) {
      const displayName =
        user.name ??
        `${user.given_name ?? ""} ${user.family_name ?? ""}`.trim();
      const status = "active";

      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.user_id)
        .first<{ id: string }>();

      await db
        .prepare(
          `INSERT OR REPLACE INTO directory_users
           (id, tenant_id, external_id, email, display_name, status, raw_attributes, updated_at)
           VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(
          existing?.id ?? null,
          tenantId,
          user.user_id,
          user.email,
          displayName,
          status,
          JSON.stringify(user),
        )
        .run();

      if (existing) {
        updated++;
      } else {
        created++;
      }
      total++;
    }

    if (users.length < perPage) break;
    page++;
  } while (true);

  return { created, updated, total };
}
