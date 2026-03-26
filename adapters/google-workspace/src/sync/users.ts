import type { GoogleUser, SyncResult } from "../types.js";

const ADMIN_API_BASE = "https://admin.googleapis.com/admin/directory/v1";

export interface LifecycleChange {
  type:
    | "user.created"
    | "user.deactivated"
    | "user.reactivated"
    | "user.profile_updated"
    | "user.deleted";
  payload: {
    user: {
      externalId: string;
      email: string;
      department?: string | null;
      title?: string | null;
      orgUnit?: string | null;
      delta?: Record<string, { old: unknown; new: unknown }>;
    };
  };
}

export async function syncUsers(
  accessToken: string,
  domain: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult & { lifecycleChanges: LifecycleChange[] }> {
  // Snapshot existing users from D1 for lifecycle diff
  const { results: existingRows } = await db
    .prepare(
      "SELECT id, external_id, email, status, department, title FROM directory_users WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .all<{
      id: string;
      external_id: string;
      email: string;
      status: string;
      department: string | null;
      title: string | null;
    }>();
  const existingMap = new Map(existingRows.map((r) => [r.external_id, r]));

  let created = 0;
  let updated = 0;
  let total = 0;
  const lifecycleChanges: LifecycleChange[] = [];
  const seenIds = new Set<string>();
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
      const orgUnit = user.orgUnitPath ?? null;
      const displayName =
        user.name.fullName ??
        `${user.name.givenName ?? ""} ${user.name.familyName ?? ""}`.trim();
      const newStatus = user.suspended ? "suspended" : "active";

      const existing = existingMap.get(user.id);
      seenIds.add(user.id);

      // ── Lifecycle detection ─────────────────────────────────────────────
      if (!existing) {
        lifecycleChanges.push({
          type: "user.created",
          payload: {
            user: {
              externalId: user.id,
              email: user.primaryEmail,
              department,
              title,
              orgUnit,
            },
          },
        });
      } else {
        const wasActive = existing.status === "active";
        const isNowActive = !user.suspended;

        if (wasActive && !isNowActive) {
          lifecycleChanges.push({
            type: "user.deactivated",
            payload: { user: { externalId: user.id, email: user.primaryEmail } },
          });
        } else if (!wasActive && isNowActive) {
          lifecycleChanges.push({
            type: "user.reactivated",
            payload: { user: { externalId: user.id, email: user.primaryEmail } },
          });
        }

        const delta: Record<string, { old: unknown; new: unknown }> = {};
        if (existing.department !== department) {
          delta.department = { old: existing.department, new: department };
        }
        if (existing.title !== title) {
          delta.title = { old: existing.title, new: title };
        }
        if (Object.keys(delta).length > 0) {
          lifecycleChanges.push({
            type: "user.profile_updated",
            payload: {
              user: {
                externalId: user.id,
                email: user.primaryEmail,
                department,
                delta,
              },
            },
          });
        }
      }

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
          newStatus,
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

  // Detect users removed from Google (in D1 but not seen in this sync)
  for (const [extId, existing] of existingMap) {
    if (
      !seenIds.has(extId) &&
      existing.status !== "deleted" &&
      existing.status !== "suspended"
    ) {
      lifecycleChanges.push({
        type: "user.deleted",
        payload: { user: { externalId: extId, email: existing.email } },
      });
    }
  }

  return { created, updated, total, lifecycleChanges };
}
