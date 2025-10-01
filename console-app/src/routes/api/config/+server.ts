import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * Runtime configuration endpoint consumed by the console to discover backend service base URLs.
 * This allows deploying the static console bundle while pointing at different compliance API origins.
 *
 * Exposed shape is append-only; do not remove existing fields to avoid breaking clients.
 */
export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};
  // Fallback keeps local dev working if no env provided.
  const complianceBase: string = env.COMPLIANCE_BASE || "/api/mock/compliance";
  return json({ complianceBase });
};
