import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

const SUGGESTION_PATTERNS: [RegExp, string[]][] = [
  [/engineer|dev|developer|eng/i, ["github", "jira"]],
  [/finance|accounting|payroll/i, ["quickbooks", "xero"]],
  [/hr|people|talent/i, ["bamboohr"]],
  [/security|infosec|soc/i, ["crowdstrike"]],
  [/ops|devops|platform|infra/i, ["aws", "datadog"]],
  [/sales|revenue|bdr|sdr/i, ["salesforce"]],
  [/marketing|growth/i, ["slack"]],
];

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "no tenant" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "database unavailable" }, { status: 500 });

  const groups = await db
    .prepare(`SELECT id, name FROM directory_groups WHERE tenant_id = ?`)
    .bind(tenantId)
    .all()
    .then((r: any) => r.results || []);

  if (groups.length === 0) {
    return json({ suggestions: [], message: "no groups found" });
  }

  const now = new Date().toISOString();
  const suggestions: any[] = [];

  for (const group of groups) {
    for (const [pattern, appIds] of SUGGESTION_PATTERNS) {
      if (pattern.test(group.name)) {
        for (const appId of appIds) {
          const id = crypto.randomUUID();
          const result = await db
            .prepare(
              `INSERT INTO group_app_mappings (id, tenant_id, group_id, app_id, role, suggested, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'member', 1, ?, ?)
               ON CONFLICT(tenant_id, group_id, app_id) DO NOTHING`,
            )
            .bind(id, tenantId, group.id, appId, now, now)
            .run();

          if (result?.meta?.changes > 0) {
            suggestions.push({
              id,
              groupId: group.id,
              groupName: group.name,
              appId,
              role: "member",
              suggested: 1,
            });
          }
        }
      }
    }
  }

  if (suggestions.length > 0) {
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId,
      actorEmail: user.email,
      action: "mapping.auto_suggest",
      targetType: "group_app_mapping",
      detail: JSON.stringify({ count: suggestions.length }),
    });
  }

  return json({ suggestions });
};
