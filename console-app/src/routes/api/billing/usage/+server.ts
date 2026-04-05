import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/** POST /api/billing/usage — record a usage metric event */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = (platform?.env as any)?.DB;
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const { metric, quantity } = body as { metric: string; quantity?: number };

  const validMetrics = [
    "active_users",
    "adapters_connected",
    "compliance_frameworks",
    "automation_executions",
    "evidence_collected",
    "api_calls",
  ];

  if (!validMetrics.includes(metric)) {
    return json({ error: "Invalid metric" }, { status: 400 });
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  try {
    await db
      .prepare(
        `INSERT INTO usage_records (id, tenant_id, metric, quantity, recorded_at, period_start, period_end)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`,
      )
      .bind(crypto.randomUUID(), user.tenantId, metric, quantity || 1, periodStart, periodEnd)
      .run();

    return json({ recorded: true });
  } catch (err: any) {
    console.error("Usage record error:", err?.message);
    return json({ error: "Failed to record usage" }, { status: 500 });
  }
};
