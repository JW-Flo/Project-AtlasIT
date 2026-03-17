import type { SyncResult } from "../types.js";

const API_BASE = "https://api.figma.com/v1";

export async function syncGroups(
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
      `${API_BASE}/organizations/${encodeURIComponent(orgId)}/teams`,
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
        `Figma API teams request failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      teams?: Array<{ id: string; name: string; icon?: string }>;
      pagination?: { after_cursor?: string };
    };

    const teams = data.teams ?? [];

    for (const team of teams) {
      const existing = await db
        .prepare(
          "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, team.id)
        .first<{ id: string }>();

      await db
        .prepare(
          `INSERT OR REPLACE INTO directory_groups
           (id, tenant_id, external_id, name, description, updated_at)
           VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(existing?.id ?? null, tenantId, team.id, team.name, null)
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
