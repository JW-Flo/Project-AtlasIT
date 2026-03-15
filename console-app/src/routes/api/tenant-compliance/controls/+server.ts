import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  buildDefaultControls,
  type Control,
} from "$lib/compliance/framework-controls";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  // Get tenant frameworks
  let frameworks: string[] = [];
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      frameworks = JSON.parse(row.value as string);
    }
  } catch {
    // no frameworks set
  }

  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
  }

  // Check for saved control statuses
  let controls: Control[] | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      controls = JSON.parse(row.value as string);
    }
  } catch {
    // no saved controls
  }

  if (!controls) {
    controls = buildDefaultControls(frameworks);
  }

  return json({ frameworks, controls });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { controls } = body as { controls?: Control[] };

  if (!controls || !Array.isArray(controls)) {
    return json({ error: "controls array required" }, { status: 400 });
  }

  // Validate each control
  const validStatuses = [
    "not_started",
    "in_progress",
    "implemented",
    "verified",
  ];
  for (const c of controls) {
    if (!c.id || !c.framework || !c.name || !validStatuses.includes(c.status)) {
      return json({ error: `Invalid control: ${c.id}` }, { status: 400 });
    }
  }

  await db
    .prepare(
      `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'compliance_controls', ?)`,
    )
    .bind(user.tenantId, JSON.stringify(controls))
    .run();

  return json({ success: true });
};
