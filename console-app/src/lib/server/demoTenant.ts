import { hashPasswordPBKDF2 } from "$lib/server/password";

export interface DemoTenantConfig {
  email: string;
  password: string;
  tenantId: string;
  tenantName: string;
}

const DEFAULT_DEMO_EMAIL = "demo@atlasit.pro";
const DEFAULT_DEMO_TENANT_ID = "demo-acme-dental";
const DEFAULT_DEMO_TENANT_NAME = "Acme Dental Group";
const DEMO_USER_ID = "demo-acme-super-admin";

export function resolveDemoTenantConfig(
  env: Record<string, unknown> | undefined,
): DemoTenantConfig | null {
  const emailRaw = String(env?.DEMO_SEEDED_EMAIL ?? DEFAULT_DEMO_EMAIL)
    .trim()
    .toLowerCase();
  const passwordRaw = String(env?.DEMO_SEEDED_PASSWORD ?? "").trim();
  const tenantIdRaw = String(env?.DEMO_TENANT_ID ?? DEFAULT_DEMO_TENANT_ID)
    .trim()
    .toLowerCase();
  const tenantNameRaw = String(env?.DEMO_TENANT_NAME ?? DEFAULT_DEMO_TENANT_NAME).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) return null;
  if (passwordRaw.length < 12) return null;
  if (!/^[a-z0-9-]{3,64}$/.test(tenantIdRaw)) return null;
  if (!tenantNameRaw || tenantNameRaw.length > 120) return null;

  return {
    email: emailRaw,
    password: passwordRaw,
    tenantId: tenantIdRaw,
    tenantName: tenantNameRaw,
  };
}

export async function resetDemoTenant(db: D1Database, cfg: DemoTenantConfig): Promise<void> {
  const now = new Date().toISOString();
  const salt = crypto.randomUUID();
  const passwordHash = await hashPasswordPBKDF2(cfg.password, salt);

  await db
    .prepare(
      `INSERT INTO tenants (id, name, slug, status, tier, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'professional', ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, status='active', updated_at=excluded.updated_at`,
    )
    .bind(cfg.tenantId, cfg.tenantName, "acme-dental-group-demo", now, now)
    .run();

  await db.prepare("DELETE FROM console_users WHERE tenant_id = ?").bind(cfg.tenantId).run();
  await db
    .prepare(
      `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      DEMO_USER_ID,
      cfg.email,
      passwordHash,
      salt,
      "Demo Super Admin",
      '["super-admin","owner","admin"]',
      cfg.tenantId,
      now,
    )
    .run();

  const wipeTables = [
    "automation_executions",
    "automation_rules",
    "incidents",
    "access_review_decisions",
    "access_review_items",
    "access_review_campaigns",
    "tenant_preferences",
    "integrations",
  ];
  for (const table of wipeTables) {
    try {
      await db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).bind(cfg.tenantId).run();
    } catch {
      // table may be unavailable in older environments
    }
  }

  await db
    .prepare(
      `INSERT INTO automation_rules
      (id, tenant_id, name, description, enabled, trigger_type, trigger_config, conditions, actions, created_at, updated_at, created_by)
      VALUES
      ('demo-onboard-dentist', ?, 'Onboard Dentist workflow', 'Provision baseline access for new dentist hires', 1, 'user_created', '{}', '[]', '[{"type":"assign_apps","apps":["okta","slack","google-workspace"]}]', ?, ?, ?),
      ('demo-offboard-contractor', ?, 'Offboard Contractor workflow', 'Revoke all app access and archive data', 1, 'user_deactivated', '{}', '[]', '[{"type":"revoke_access","scope":"all"}]', ?, ?, ?),
      ('demo-device-quarantine', ?, 'Device quarantine flow', 'Contain risky endpoint automatically', 1, 'app_health_changed', '{}', '[]', '[{"type":"create_incident","severity":"high"}]', ?, ?, ?)
      `,
    )
    .bind(
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
    )
    .run();

  await db
    .prepare(
      `INSERT INTO incidents (id, tenant_id, title, severity, status, source, description, created_at)
       VALUES
       ('demo-inc-1', ?, 'Suspicious login blocked', 'high', 'resolved', 'automation', 'Impossible-travel login blocked and account challenged.', ?),
       ('demo-inc-2', ?, 'MFA bypass attempt', 'critical', 'investigating', 'identity', 'Legacy protocol access attempt detected for privileged user.', ?),
       ('demo-inc-3', ?, 'Terminated employee access removed', 'medium', 'resolved', 'automation', 'Offboarding flow revoked access across connected SaaS apps.', ?)
      `,
    )
    .bind(cfg.tenantId, now, cfg.tenantId, now, cfg.tenantId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO access_review_campaigns (id, tenant_id, name, scope, status, reviewer_policy, due_date, created_by, created_at)
      VALUES ('demo-access-q2', ?, 'Q2 Privileged Access Review', 'all', 'active', 'owner', datetime('now', '+10 day'), ?, ?)`,
    )
    .bind(cfg.tenantId, DEMO_USER_ID, now)
    .run();

  const prefs: Array<[string, unknown]> = [
    ["frameworks", ["HIPAA", "SOC2"]],
    [
      "selected_apps",
      ["google-workspace", "slack", "okta", "intune", "microsoft-365", "crowdstrike"],
    ],
    [
      "demo_story",
      {
        employees: 43,
        complianceScore: 86,
        pendingReviews: 3,
        openIncidents: 2,
        automationsToday: 17,
      },
    ],
  ];
  for (const [key, value] of prefs) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(cfg.tenantId, key, JSON.stringify(value), now)
      .run();
  }
}
