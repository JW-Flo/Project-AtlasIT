import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

function generateSyntheticData(tenantDomain) {
  const users = [
    {
      email: `alice.chen@${tenantDomain}`,
      displayName: "Alice Chen",
      department: "Engineering",
      title: "Senior Engineer"
    },
    {
      email: `bob.martinez@${tenantDomain}`,
      displayName: "Bob Martinez",
      department: "Sales",
      title: "Account Executive"
    },
    {
      email: `carol.johnson@${tenantDomain}`,
      displayName: "Carol Johnson",
      department: "HR",
      title: "HR Manager"
    },
    {
      email: `dave.kim@${tenantDomain}`,
      displayName: "Dave Kim",
      department: "Engineering",
      title: "Staff Engineer"
    },
    {
      email: `eve.patel@${tenantDomain}`,
      displayName: "Eve Patel",
      department: "Security",
      title: "Security Analyst"
    },
    {
      email: `frank.wu@${tenantDomain}`,
      displayName: "Frank Wu",
      department: "Finance",
      title: "Financial Analyst"
    },
    {
      email: `grace.lee@${tenantDomain}`,
      displayName: "Grace Lee",
      department: "Sales",
      title: "Sales Director"
    },
    {
      email: `henry.brown@${tenantDomain}`,
      displayName: "Henry Brown",
      department: "DevOps",
      title: "Platform Engineer"
    }
  ];
  const groups = [
    { name: "Engineering", description: "Engineering team members" },
    { name: "Sales", description: "Sales and revenue team" },
    { name: "HR", description: "Human resources team" },
    { name: "Security", description: "Information security team" },
    { name: "Finance", description: "Finance and accounting team" },
    { name: "DevOps", description: "DevOps and platform team" }
  ];
  const memberships = {
    Engineering: ["alice.chen", "dave.kim"],
    Sales: ["bob.martinez", "grace.lee"],
    HR: ["carol.johnson"],
    Security: ["eve.patel"],
    Finance: ["frank.wu"],
    DevOps: ["henry.brown"]
  };
  return { users, groups, memberships };
}
const POST = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });
  const connection = await db.prepare(`SELECT * FROM directory_connections WHERE tenant_id = ?`).bind(tenantId).first();
  if (!connection) {
    return json({ error: "no directory connection found" }, { status: 404 });
  }
  if (connection.status === "syncing") {
    return json({ error: "sync already in progress" }, { status: 409 });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `UPDATE directory_connections SET status = 'syncing', updated_at = ? WHERE tenant_id = ?`
  ).bind(now, tenantId).run();
  try {
    const env = platform?.env || {};
    const orchestratorUrl = env.ORCHESTRATOR_URL;
    const serviceApiKey = env.ORCHESTRATOR_API_KEY || env.INTERNAL_API_KEY || "";
    if (env.SYNTHETIC_DIRECTORY !== "true" && connection.provider && orchestratorUrl) {
      const syncRes = await fetch(`${orchestratorUrl}/api/v1/directory/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          ...serviceApiKey ? { "X-API-Key": serviceApiKey } : {}
        },
        body: JSON.stringify({ provider: connection.provider })
      });
      if (syncRes.ok) {
        const adapterData = await syncRes.json().catch(() => ({}));
        const userCount2 = adapterData.users?.length ?? adapterData.userCount ?? 0;
        const groupCount2 = adapterData.groups?.length ?? adapterData.groupCount ?? 0;
        await db.prepare(
          `UPDATE directory_connections SET status = 'active', last_sync_at = ?, user_count = ?, group_count = ?, error_msg = NULL, updated_at = ? WHERE tenant_id = ?`
        ).bind(now, userCount2, groupCount2, now, tenantId).run();
        await writeAudit(db, {
          tenantId,
          actorUserId: user.userId,
          actorEmail: user.email,
          action: "directory.sync",
          targetType: "directory_connection",
          targetId: connection.id,
          detail: JSON.stringify({
            userCount: userCount2,
            groupCount: groupCount2,
            source: "orchestrator",
            provider: connection.provider
          })
        });
        return json({ success: true, userCount: userCount2, groupCount: groupCount2, source: "orchestrator" });
      }
      console.warn(`Orchestrator sync failed (${syncRes.status}), falling back to synthetic`);
    }
    const tenantDomain = user.email?.split("@")[1] || "example.com";
    const { users, groups, memberships } = generateSyntheticData(tenantDomain);
    const existingRows = await db.prepare(`SELECT email, status FROM directory_users WHERE tenant_id = ?`).bind(tenantId).all().then((r) => r.results || []);
    const existingEmails = new Set(existingRows.map((r) => r.email));
    const existingActiveEmails = new Set(
      existingRows.filter((r) => r.status === "active").map((r) => r.email)
    );
    const incomingEmails = new Set(users.map((u) => u.email));
    const newUsers = [];
    for (const u of users) {
      const id = crypto.randomUUID();
      const externalId = u.email.split("@")[0];
      await db.prepare(
        `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
           ON CONFLICT(tenant_id, external_id) DO UPDATE SET
             email = excluded.email, display_name = excluded.display_name,
             department = excluded.department, title = excluded.title,
             status = excluded.status, raw_attributes = excluded.raw_attributes, updated_at = excluded.updated_at`
      ).bind(
        id,
        tenantId,
        externalId,
        u.email,
        u.displayName,
        u.department,
        u.title,
        JSON.stringify(u),
        now,
        now
      ).run();
      if (!existingEmails.has(u.email)) {
        newUsers.push(u);
      }
    }
    const groupIdMap = {};
    for (const g of groups) {
      const id = crypto.randomUUID();
      const externalId = g.name.toLowerCase().replace(/\s+/g, "-");
      await db.prepare(
        `INSERT INTO directory_groups (id, tenant_id, external_id, name, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(tenant_id, external_id) DO UPDATE SET
             name = excluded.name, description = excluded.description, updated_at = excluded.updated_at`
      ).bind(id, tenantId, externalId, g.name, g.description, now, now).run();
      const row = await db.prepare(`SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?`).bind(tenantId, externalId).first();
      groupIdMap[g.name] = row?.id ?? id;
    }
    for (const [groupName, userExternalIds] of Object.entries(memberships)) {
      const groupId = groupIdMap[groupName];
      if (!groupId) continue;
      for (const externalId of userExternalIds) {
        const userRow = await db.prepare(`SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?`).bind(tenantId, externalId).first();
        if (!userRow) continue;
        const membershipId = crypto.randomUUID();
        await db.prepare(
          `INSERT INTO directory_memberships (id, tenant_id, user_id, group_id, created_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(tenant_id, user_id, group_id) DO NOTHING`
        ).bind(membershipId, tenantId, userRow.id, groupId, now).run();
      }
    }
    const userCount = users.length;
    const groupCount = groups.length;
    await db.prepare(
      `UPDATE directory_connections SET status = 'active', last_sync_at = ?, user_count = ?, group_count = ?, error_msg = NULL, updated_at = ? WHERE tenant_id = ?`
    ).bind(now, userCount, groupCount, now, tenantId).run();
    await autoSuggestMappings(db, tenantId);
    if (orchestratorUrl) {
      const deactivatedEmails = [...existingActiveEmails].filter((e) => !incomingEmails.has(e));
      const eventPayloads = [
        ...newUsers.map((u) => ({
          tenantId,
          type: "user.created",
          source: "console-directory-sync",
          payload: {
            userId: u.email.split("@")[0],
            email: u.email,
            displayName: u.displayName,
            department: u.department,
            status: "active"
          }
        })),
        ...deactivatedEmails.map((email) => ({
          tenantId,
          type: "user.deactivated",
          source: "console-directory-sync",
          payload: {
            userId: email.split("@")[0],
            email,
            status: "inactive"
          }
        }))
      ];
      const eventResults = await Promise.allSettled(
        eventPayloads.map(
          (evt) => fetch(`${orchestratorUrl}/api/v1/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Tenant-ID": tenantId,
              ...serviceApiKey ? { "X-API-Key": serviceApiKey } : {}
            },
            body: JSON.stringify(evt)
          })
        )
      );
      for (const r of eventResults) {
        if (r.status === "rejected") {
          console.error("[directory-sync] Event delivery failed:", r.reason);
        }
      }
    }
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId,
      actorEmail: user.email,
      action: "directory.sync",
      targetType: "directory_connection",
      targetId: connection.id,
      detail: JSON.stringify({ userCount, groupCount })
    });
    return json({ success: true, userCount, groupCount });
  } catch (err) {
    await db.prepare(
      `UPDATE directory_connections SET status = 'error', error_msg = ?, updated_at = ? WHERE tenant_id = ?`
    ).bind(err?.message ?? "unknown error", (/* @__PURE__ */ new Date()).toISOString(), tenantId).run();
    return json({ error: "sync failed", detail: err?.message }, { status: 500 });
  }
};
async function autoSuggestMappings(db, tenantId) {
  const patterns = [
    [/engineer|dev|developer|eng/i, ["github", "jira"]],
    [/finance|accounting|payroll/i, ["quickbooks", "xero"]],
    [/hr|people|talent/i, ["bamboohr"]],
    [/security|infosec|soc/i, ["crowdstrike"]],
    [/ops|devops|platform|infra/i, ["aws", "datadog"]],
    [/sales|revenue|bdr|sdr/i, ["salesforce"]],
    [/marketing|growth/i, ["slack"]]
  ];
  const groups = await db.prepare(`SELECT id, name FROM directory_groups WHERE tenant_id = ?`).bind(tenantId).all().then((r) => r.results || []);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  for (const group of groups) {
    for (const [pattern, appIds] of patterns) {
      if (pattern.test(group.name)) {
        for (const appId of appIds) {
          const id = crypto.randomUUID();
          await db.prepare(
            `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'member', 1, ?, ?)
               ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`
          ).bind(id, tenantId, group.id, appId, now, now).run();
        }
      }
    }
  }
}

export { POST };
//# sourceMappingURL=_server.ts-DD_CTKq5.js.map
