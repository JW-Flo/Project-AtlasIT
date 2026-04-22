import { json } from '@sveltejs/kit';

const POST = async ({ params, request, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });
  const tenant = await db.prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`).bind(slug).first();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const pubPref = await db.prepare(
    `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`
  ).bind(tenant.id).first();
  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }
  let body;
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
  if (!email.includes("@") || !email.includes(".")) {
    return json({ error: "Invalid email" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO trust_access_requests (id, tenant_id, requester_name, requester_email, requester_company, reason)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, tenant.id, name, email, company || null, reason || null).run();
  return json({ id, status: "pending" }, { status: 201 });
};

export { POST };
//# sourceMappingURL=_server.ts-DaQf50Xa.js.map
