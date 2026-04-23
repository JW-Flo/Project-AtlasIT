import { hashPasswordPBKDF2 } from "$lib/server/password";
import { queryPg } from "$lib/server/pg";

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

export async function resetDemoTenant(cfg: DemoTenantConfig): Promise<void> {
  const now = new Date().toISOString();
  const salt = crypto.randomUUID();
  const passwordHash = await hashPasswordPBKDF2(cfg.password, salt);
  const demoRuleOnboardId = `${cfg.tenantId}-onboard-dentist`;
  const demoRuleOffboardId = `${cfg.tenantId}-offboard-contractor`;
  const demoRuleQuarantineId = `${cfg.tenantId}-device-quarantine`;
  const demoIncident1Id = `${cfg.tenantId}-inc-1`;
  const demoIncident2Id = `${cfg.tenantId}-inc-2`;
  const demoIncident3Id = `${cfg.tenantId}-inc-3`;
  const demoAccessCampaignId = `${cfg.tenantId}-access-q2`;
  const tenantSlug = `${cfg.tenantId}-demo`;

  await queryPg(
    `INSERT INTO tenants (id, name, slug, status, tier, created_at, updated_at)
     VALUES ($1, $2, $3, 'active', 'professional', $4, $5)
     ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, status='active', updated_at=EXCLUDED.updated_at`,
    [cfg.tenantId, cfg.tenantName, tenantSlug, now, now],
  );

  await queryPg(`DELETE FROM console_users WHERE tenant_id = $1 OR id = $2`, [
    cfg.tenantId,
    DEMO_USER_ID,
  ]);

  await queryPg(
    `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(email) DO UPDATE SET
       id=EXCLUDED.id,
       password_hash=EXCLUDED.password_hash,
       salt=EXCLUDED.salt,
       display_name=EXCLUDED.display_name,
       roles=EXCLUDED.roles,
       tenant_id=EXCLUDED.tenant_id,
       created_at=EXCLUDED.created_at`,
    [
      DEMO_USER_ID,
      cfg.email,
      passwordHash,
      salt,
      "Demo Super Admin",
      '["super-admin","owner","admin"]',
      cfg.tenantId,
      now,
    ],
  );

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
      await queryPg(`DELETE FROM ${table} WHERE tenant_id = $1`, [cfg.tenantId]);
    } catch {
      // table may be unavailable in older environments
    }
  }

  await queryPg(
    `INSERT INTO automation_rules
      (id, tenant_id, name, description, enabled, trigger_type, trigger_config, conditions, actions, created_at, updated_at, created_by)
      VALUES
      ($1, $2, 'Onboard Dentist workflow', 'Provision baseline access for new dentist hires', true, 'user_created', '{}', '[]', '[{"type":"assign_apps","apps":["okta","slack","google-workspace"]}]', $3, $4, $5),
      ($6, $7, 'Offboard Contractor workflow', 'Revoke all app access and archive data', true, 'user_deactivated', '{}', '[]', '[{"type":"revoke_access","scope":"all"}]', $8, $9, $10),
      ($11, $12, 'Device quarantine flow', 'Contain risky endpoint automatically', true, 'app_health_changed', '{}', '[]', '[{"type":"create_incident","severity":"high"}]', $13, $14, $15)`,
    [
      demoRuleOnboardId,
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
      demoRuleOffboardId,
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
      demoRuleQuarantineId,
      cfg.tenantId,
      now,
      now,
      DEMO_USER_ID,
    ],
  );

  await queryPg(
    `INSERT INTO incidents (id, tenant_id, title, severity, status, source, description, created_at)
     VALUES
     ($1, $2, 'Suspicious login blocked', 'high', 'resolved', 'automation', 'Impossible-travel login blocked and account challenged.', $3),
     ($4, $5, 'MFA bypass attempt', 'critical', 'investigating', 'identity', 'Legacy protocol access attempt detected for privileged user.', $6),
     ($7, $8, 'Terminated employee access removed', 'medium', 'resolved', 'automation', 'Offboarding flow revoked access across connected SaaS apps.', $9)`,
    [
      demoIncident1Id,
      cfg.tenantId,
      now,
      demoIncident2Id,
      cfg.tenantId,
      now,
      demoIncident3Id,
      cfg.tenantId,
      now,
    ],
  );

  await queryPg(
    `INSERT INTO access_review_campaigns (id, tenant_id, name, scope, status, reviewer_policy, due_date, created_by, created_at)
     VALUES ($1, $2, 'Q2 Privileged Access Review', 'all', 'active', 'owner', NOW() + INTERVAL '10 days', $3, $4)`,
    [demoAccessCampaignId, cfg.tenantId, DEMO_USER_ID, now],
  );

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
    await queryPg(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [cfg.tenantId, key, JSON.stringify(value), now],
    );
  }
}
