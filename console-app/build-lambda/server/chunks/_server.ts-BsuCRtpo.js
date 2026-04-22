import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { D as DEFAULT_SLA_SECONDS } from './lifecycle-BLhc1MUq.js';

function getDb(platform) {
  const env = platform?.env || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}
const SLA_MIN_SECONDS = 60;
const SLA_MAX_SECONDS = 604800;
const GET = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  try {
    const row = await db.prepare(
      "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'"
    ).bind(tenantId).first();
    if (row?.value) {
      return json(JSON.parse(row.value));
    }
  } catch {
  }
  return json(DEFAULT_SLA_SECONDS);
};
const PUT = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const severities = ["critical", "high", "medium", "low"];
  for (const key of severities) {
    const val = body[key];
    if (val !== void 0) {
      if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
        return json(
          { error: `Field '${key}' must be a positive number` },
          { status: 400 }
        );
      }
      if (val < SLA_MIN_SECONDS || val > SLA_MAX_SECONDS) {
        return json(
          {
            error: `Field '${key}' must be between ${SLA_MIN_SECONDS} and ${SLA_MAX_SECONDS} seconds (1 minute to 7 days)`
          },
          { status: 400 }
        );
      }
    }
  }
  const config = {
    ...DEFAULT_SLA_SECONDS,
    ...Object.fromEntries(
      severities.filter((k) => body[k] !== void 0).map((k) => [k, body[k]])
    )
  };
  await db.prepare(
    `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'incident_sla_config', ?)`
  ).bind(tenantId, JSON.stringify(config)).run();
  return json(config);
};

export { GET, PUT };
//# sourceMappingURL=_server.ts-BsuCRtpo.js.map
