import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { detectRiskAnomalies } from "@atlasit/shared";

/**
 * GET /api/compliance-intelligence/anomalies
 * Returns risk anomalies detected from automation execution history.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  let anomalies: unknown[] = [];
  try {
    anomalies = await detectRiskAnomalies(db, tenantId);
  } catch (err) {
    console.error(
      JSON.stringify({ level: "error", message: "Anomaly detection failed", error: String(err) }),
    );
    return json({
      tenantId,
      anomalies: [],
      detectedAt: new Date().toISOString(),
      error: "Detection failed",
    });
  }

  return json({ tenantId, anomalies, detectedAt: new Date().toISOString() });
};
