import type { GoogleUser, SyncResult } from "../types.js";

const ADMIN_API_BASE = "https://admin.googleapis.com/admin/directory/v1";

export async function syncUsers(
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
    const url = new URL(`${ADMIN_API_BASE}/users`);
    url.searchParams.set("domain", domain);
    url.searchParams.set("maxResults", "200");
    url.searchParams.set("projection", "full");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Google Admin API users request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      users?: GoogleUser[];
      nextPageToken?: string;
    };

    const users = data.users ?? [];

    for (const user of users) {
      const department = user.organizations?.[0]?.department ?? null;
      const title = user.organizations?.[0]?.title ?? null;
      const displayName =
        user.name.fullName ??
        `${user.name.givenName ?? ""} ${user.name.familyName ?? ""}`.trim();
      const status = user.suspended ? "suspended" : "active";

      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.id)
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
          user.id,
          user.primaryEmail,
          displayName,
          department,
          title,
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

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { created, updated, total };
}
