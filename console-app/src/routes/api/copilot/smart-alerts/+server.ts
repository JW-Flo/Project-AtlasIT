import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { SmartAlert } from "@atlasit/shared";

/** Fetch current smart alerts for the tenant */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ alerts: [] });

  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'smart_alerts'")
      .bind(tenantId)
      .first<{ value: string }>();

    if (!row?.value) {
      return json({ alerts: [], evaluatedAt: null });
    }

    const data = JSON.parse(row.value) as {
      tenantId: string;
      evaluatedAt: string;
      alerts: SmartAlert[];
    };

    return json({ alerts: data.alerts, evaluatedAt: data.evaluatedAt });
  } catch {
    return json({ alerts: [], evaluatedAt: null });
  }
};

/** Acknowledge a smart alert */
export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const alertId = (body as any).alertId;
  if (!alertId) return json({ error: "alertId required" }, { status: 400 });

  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'smart_alerts'")
      .bind(tenantId)
      .first<{ value: string }>();

    if (!row?.value) return json({ error: "No alerts found" }, { status: 404 });

    const data = JSON.parse(row.value);
    const alert = data.alerts?.find((a: SmartAlert) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }

    const updated = JSON.stringify(data);
    await db
      .prepare(
        `UPDATE tenant_preferences SET value = ?, updated_at = datetime('now')
         WHERE tenant_id = ? AND key = 'smart_alerts'`,
      )
      .bind(updated, tenantId)
      .run();

    return json({ success: true });
  } catch {
    return json({ error: "Failed to acknowledge alert" }, { status: 500 });
  }
};
