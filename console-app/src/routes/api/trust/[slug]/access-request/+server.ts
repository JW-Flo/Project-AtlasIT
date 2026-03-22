/**
 * NDA-gated access request — public endpoint.
 * Visitors can request access to NDA-gated evidence.
 *
 * POST /api/trust/:slug/access-request
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ params, request, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  // Resolve tenant
  const tenant = await db
    .prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string }>();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });

  // Check trust center is public
  const pubPref = await db
    .prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`,
    )
    .bind(tenant.id)
    .first<{ value: string }>();
  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!name || !email) {
    return json({ error: "name and email are required" }, { status: 400 });
  }

  // Basic email validation
  if (!email.includes("@") || !email.includes(".")) {
    return json({ error: "Invalid email" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO trust_access_requests (id, tenant_id, requester_name, requester_email, requester_company, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, tenant.id, name, email, company || null, reason || null)
    .run();

  return json({ id, status: "pending" }, { status: 201 });
};
