import { json } from '@sveltejs/kit';
import { a as requireSuperAdmin } from './guards-rSzq6XQW.js';
import { r as resolveDemoTenantConfig, a as resetDemoTenant } from './demoTenant-CWyzajKa.js';
import './password-DUgJgP1B.js';

const POST = async ({ locals, platform }) => {
  const denied = requireSuperAdmin(locals.user);
  if (denied) return denied;
  const env = platform?.env || {};
  const demoMode = String(env.DEMO_MODE ?? "false").toLowerCase() === "true";
  if (!demoMode) return json({ error: "demo_mode_disabled" }, { status: 403 });
  const demoConfig = resolveDemoTenantConfig(env);
  if (!demoConfig) return json({ error: "demo_config_invalid" }, { status: 400 });
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "db_unavailable" }, { status: 503 });
  await resetDemoTenant(db, demoConfig);
  return json({ ok: true, reset: true });
};

export { POST };
//# sourceMappingURL=_server.ts-D8NLQoO6.js.map
