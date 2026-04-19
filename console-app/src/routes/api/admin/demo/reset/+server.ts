import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireSuperAdmin } from "$lib/server/guards";
import { resolveDemoTenantConfig, resetDemoTenant } from "$lib/server/demoTenant";

export const POST: RequestHandler = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;

  const env = (platform?.env as Record<string, unknown>) || {};
  const demoMode = String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
  if (!demoMode) return json({ error: "demo_mode_disabled" }, { status: 403 });
  const demoConfig = resolveDemoTenantConfig(env);
  if (!demoConfig) return json({ error: "demo_config_invalid" }, { status: 400 });

  const db = env.ATLAS_SHARED_DB as D1Database | undefined;
  if (!db) return json({ error: "db_unavailable" }, { status: 503 });

  await resetDemoTenant(db, demoConfig);
  return json({ ok: true, reset: true });
};
