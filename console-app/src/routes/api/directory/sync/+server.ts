import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

interface SyntheticUser {
  email: string;
  displayName: string;
  department: string;
  title: string;
}

interface SyntheticGroup {
  name: string;
  description: string;
}

function generateSyntheticData(tenantDomain: string) {
  const users: SyntheticUser[] = [
    {
      email: `alice.chen@${tenantDomain}`,
      displayName: "Alice Chen",
      department: "Engineering",
      title: "Senior Engineer",
    },
    {
      email: `bob.martinez@${tenantDomain}`,
      displayName: "Bob Martinez",
      department: "Sales",
      title: "Account Executive",
    },
    {
      email: `carol.johnson@${tenantDomain}`,
      displayName: "Carol Johnson",
      department: "HR",
      title: "HR Manager",
    },
    {
      email: `dave.kim@${tenantDomain}`,
      displayName: "Dave Kim",
      department: "Engineering",
      title: "Staff Engineer",
    },
    {
      email: `eve.patel@${tenantDomain}`,
      displayName: "Eve Patel",
      department: "Security",
      title: "Security Analyst",
    },
    {
      email: `frank.wu@${tenantDomain}`,
      displayName: "Frank Wu",
      department: "Finance",
      title: "Financial Analyst",
    },
    {
      email: `grace.lee@${tenantDomain}`,
      displayName: "Grace Lee",
      department: "Sales",
      title: "Sales Director",
    },
    {
      email: `henry.brown@${tenantDomain}`,
      displayName: "Henry Brown",
      department: "DevOps",
      title: "Platform Engineer",
    },
  ];

  const groups: SyntheticGroup[] = [
    { name: "Engineering", description: "Engineering team members" },
    { name: "Sales", description: "Sales and revenue team" },
    { name: "HR", description: "Human resources team" },
    { name: "Security", description: "Information security team" },
    { name: "Finance", description: "Finance and accounting team" },
    { name: "DevOps", description: "DevOps and platform team" },
  ];

  const memberships: Record<string, string[]> = {
    Engineering: ["alice.chen", "dave.kim"],
    Sales: ["bob.martinez", "grace.lee"],
    HR: ["carol.johnson"],
    Security: ["eve.patel"],
    Finance: ["frank.wu"],
    DevOps: ["henry.brown"],
  };

  return { users, groups, memberships };
}

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const connection = await db
    .prepare(`SELECT * FROM directory_connections WHERE tenant_id = ?`)
    .bind(tenantId)
    .first();

  if (!connection) {
    return json({ error: "no directory connection found" }, { status: 404 });
  }

  if (connection.status === "syncing") {
    return json({ error: "sync already in progress" }, { status: 409 });
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE directory_connections SET status = 'syncing', updated_at = ? WHERE tenant_id = ?`,
    )
    .bind(now, tenantId)
    .run();

  try {
    // MVP-only: synthetic directory data for demo/development
    const env = (platform?.env as any) || {};
    if (env.SYNTHETIC_DIRECTORY !== "true" && connection.provider_token) {
      return json(
        { error: "Real IdP sync not yet implemented" },
        { status: 501 },
      );
    }

    const tenantDomain = user.email?.split("@")[1] || "example.com";
    const { users, groups, memberships } = generateSyntheticData(tenantDomain);

    // Upsert users
    for (const u of users) {
      const id = crypto.randomUUID();
      const externalId = u.email.split("@")[0];
      await db
        .prepare(
          `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
           ON CONFLICT(tenant_id, external_id) DO UPDATE SET
             email = excluded.email, display_name = excluded.display_name,
             department = excluded.department, title = excluded.title,
             status = excluded.status, raw_attributes = excluded.raw_attributes, updated_at = excluded.updated_at`,
        )
        .bind(
          id,
          tenantId,
          externalId,
          u.email,
          u.displayName,
          u.department,
          u.title,
          JSON.stringify(u),
          now,
          now,
        )
        .run();
    }

    // Upsert groups
    const groupIdMap: Record<string, string> = {};
    for (const g of groups) {
      const id = crypto.randomUUID();
      const externalId = g.name.toLowerCase().replace(/\s+/g, "-");
      await db
        .prepare(
          `INSERT INTO directory_groups (id, tenant_id, external_id, name, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, external_id) DO UPDATE SET
             name = excluded.name, description = excluded.description, updated_at = excluded.updated_at`,
        )
        .bind(id, tenantId, externalId, g.name, g.description, now, now)
        .run();

      const row = await db
        .prepare(
          `SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?`,
        )
        .bind(tenantId, externalId)
        .first();
      groupIdMap[g.name] = row?.id ?? id;
    }

    // Upsert memberships
    for (const [groupName, userExternalIds] of Object.entries(memberships)) {
      const groupId = groupIdMap[groupName];
      if (!groupId) continue;

      for (const externalId of userExternalIds) {
        const userRow = await db
          .prepare(
            `SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?`,
          )
          .bind(tenantId, externalId)
          .first();
        if (!userRow) continue;

        const membershipId = crypto.randomUUID();
        await db
          .prepare(
            `INSERT INTO directory_memberships (id, tenant_id, user_id, group_id, created_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(tenant_id, user_id, group_id) DO NOTHING`,
          )
          .bind(membershipId, tenantId, userRow.id, groupId, now)
          .run();
      }
    }

    const userCount = users.length;
    const groupCount = groups.length;

    await db
      .prepare(
        `UPDATE directory_connections SET status = 'active', last_sync_at = ?, user_count = ?, group_count = ?, error_msg = NULL, updated_at = ? WHERE tenant_id = ?`,
      )
      .bind(now, userCount, groupCount, now, tenantId)
      .run();

    // Auto-suggest mappings after first sync
    await autoSuggestMappings(db, tenantId);

    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId,
      actorEmail: user.email,
      action: "directory.sync",
      targetType: "directory_connection",
      targetId: connection.id,
      detail: JSON.stringify({ userCount, groupCount }),
    });

    return json({ success: true, userCount, groupCount });
  } catch (err: any) {
    await db
      .prepare(
        `UPDATE directory_connections SET status = 'error', error_msg = ?, updated_at = ? WHERE tenant_id = ?`,
      )
      .bind(err?.message ?? "unknown error", new Date().toISOString(), tenantId)
      .run();

    return json(
      { error: "sync failed", detail: err?.message },
      { status: 500 },
    );
  }
};

async function autoSuggestMappings(db: any, tenantId: string) {
  const patterns: [RegExp, string[]][] = [
    [/engineer|dev|developer|eng/i, ["github", "jira"]],
    [/finance|accounting|payroll/i, ["quickbooks", "xero"]],
    [/hr|people|talent/i, ["bamboohr"]],
    [/security|infosec|soc/i, ["crowdstrike"]],
    [/ops|devops|platform|infra/i, ["aws", "datadog"]],
    [/sales|revenue|bdr|sdr/i, ["salesforce"]],
    [/marketing|growth/i, ["slack"]],
  ];

  const groups = await db
    .prepare(`SELECT id, name FROM directory_groups WHERE tenant_id = ?`)
    .bind(tenantId)
    .all()
    .then((r: any) => r.results || []);

  const now = new Date().toISOString();

  for (const group of groups) {
    for (const [pattern, appIds] of patterns) {
      if (pattern.test(group.name)) {
        for (const appId of appIds) {
          const id = crypto.randomUUID();
          await db
            .prepare(
              `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'member', 1, ?, ?)
               ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`,
            )
            .bind(id, tenantId, group.id, appId, now, now)
            .run();
        }
      }
    }
  }
}
