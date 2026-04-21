import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { detectRiskAnomalies } from "@atlasit/shared";

/**
 * GET /api/compliance-intelligence/anomalies
 * Returns risk anomalies detected from automation execution history.
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) {
    return json({ error: "Authentication required. Please sign in again." }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required. Contact your administrator." }, { status: 403 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) {
    return json({ error: "Database unavailable. Please try again in a moment." }, { status: 503 });
  }

  try {
    const anomalies = await detectRiskAnomalies(db, tenantId);
    return json({ tenantId, anomalies, detectedAt: new Date().toISOString() });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Anomaly detection failed",
        tenantId,
        error: String(err),
      }),
    );
    return json(
      {
        error: "Failed to detect anomalies. Please try again.",
        tenantId,
        anomalies: [],
        detectedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
};
