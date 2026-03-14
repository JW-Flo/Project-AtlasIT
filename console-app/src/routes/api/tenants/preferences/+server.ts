import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  const body = await request.json().catch(() => ({}));
  const { tenantId, industry, companySize, frameworks } = body as {
    tenantId?: string;
    industry?: string;
    companySize?: string;
    frameworks?: string[];
  };

  if (!tenantId) {
    return json({ error: "tenantId required" }, { status: 400 });
  }

  if (db) {
    try {
      await db
        .prepare(
          `UPDATE tenants SET industry = ?, size = ? WHERE id = ?`
        )
        .bind(industry || null, companySize || null, tenantId)
        .run();

      // Store framework preferences
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS tenant_preferences (
             tenant_id TEXT NOT NULL,
             key TEXT NOT NULL,
             value TEXT NOT NULL,
             PRIMARY KEY (tenant_id, key)
           )`
        )
        .run();

      if (frameworks && frameworks.length > 0) {
        await db
          .prepare(
            `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
             VALUES (?, 'frameworks', ?)`
          )
          .bind(tenantId, JSON.stringify(frameworks))
          .run();
      }
    } catch (e: any) {
      console.error("Preferences save error:", e);
    }
  }

  return json({ success: true });
};
