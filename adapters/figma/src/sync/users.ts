import type { FigmaUser, SyncResult } from "../types.js";

const API_BASE = "https://api.figma.com/v1";

export async function syncUsers(
  accessToken: string,
  orgId: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;
  let afterCursor: string | undefined;

  do {
    const url = new URL(
      `${API_BASE}/organizations/${encodeURIComponent(orgId)}/users`,
    );
    if (afterCursor) {
      url.searchParams.set("after_cursor", afterCursor);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Figma API users request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      users?: FigmaUser[];
      pagination?: { after_cursor?: string };
    };

    const users = data.users ?? [];

    for (const user of users) {
      const displayName = user.handle ?? user.email;
      const status = "active";

      const existing = await db
        .prepare(
          "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, user.id)
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
          user.id,
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

    afterCursor = data.pagination?.after_cursor;
    if (!afterCursor) break;
  } while (afterCursor);

  return { created, updated, total };
}
