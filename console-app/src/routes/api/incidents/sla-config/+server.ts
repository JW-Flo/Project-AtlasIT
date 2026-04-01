import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import {
  DEFAULT_SLA_SECONDS,
  type SlaConfig,
} from "@atlasit/shared/incidents/lifecycle";

function getDb(platform: any): D1Database | null {
  const env = (platform?.env as any) || {};
  return env.ATLAS_SHARED_DB ?? env.DB ?? null;
}

const SLA_MIN_SECONDS = 60;       // 1 minute
const SLA_MAX_SECONDS = 604800;   // 7 days

export const GET: RequestHandler = async ({ platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'incident_sla_config'",
      )
      .bind(tenantId)
      .first<{ value: string }>();

    if (row?.value) {
      return json(JSON.parse(row.value) as SlaConfig);
    }
  } catch {
    // Fall through to defaults
  }

  return json(DEFAULT_SLA_SECONDS);
};

export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const db = getDb(platform);
  if (!db) return json({ error: "Database unavailable" }, { status: 503 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: Partial<SlaConfig>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const severities = ["critical", "high", "medium", "low"] as const;

  // Validate all provided values
  for (const key of severities) {
    const val = body[key];
    if (val !== undefined) {
      if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
        return json(
          { error: `Field '${key}' must be a positive number` },
          { status: 400 },
        );
      }
      if (val < SLA_MIN_SECONDS || val > SLA_MAX_SECONDS) {
        return json(
          {
            error: `Field '${key}' must be between ${SLA_MIN_SECONDS} and ${SLA_MAX_SECONDS} seconds (1 minute to 7 days)`,
          },
          { status: 400 },
        );
      }
    }
  }

  // Merge with defaults so all keys are present
  const config: SlaConfig = {
    ...DEFAULT_SLA_SECONDS,
    ...Object.fromEntries(
      severities
        .filter((k) => body[k] !== undefined)
        .map((k) => [k, body[k]]),
    ),
  } as SlaConfig;

  await db
    .prepare(
      `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'incident_sla_config', ?)`,
    )
    .bind(tenantId, JSON.stringify(config))
    .run();

  return json(config);
};
