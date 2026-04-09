import { readFileSync } from "node:fs";
import { join } from "node:path";

export async function applyMigrations(db: D1Database): Promise<void> {
  const migrationsDir = join(process.cwd(), "migrations");
  const files = [
    "0001_core_tenants_users.sql",
    "0002_integrations.sql",
    "0003_app_credentials.sql",
    "0004_directory_sync.sql",
    "0005_events.sql",
    "0006_audit_log.sql",
    "0007_onboarding_sessions.sql",
    "0008_agent_registry.sql",
    "0009_dead_letter_queue.sql",
  ];

  for (const file of files) {
    try {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));
      for (const stmt of statements) {
        await db.prepare(stmt).run();
      }
    } catch {
      // Migration file may not exist yet, skip
    }
  }
}

export async function seedTenant(
  db: D1Database,
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    status: string;
    tier: string;
  }> = {},
): Promise<string> {
  const id = overrides.id ?? crypto.randomUUID();
  const name = overrides.name ?? "Test Tenant";
  const slug = overrides.slug ?? `test-${id.slice(0, 8)}`;
  const status = overrides.status ?? "active";
  const tier = overrides.tier ?? "free";

  await db
    .prepare(
      "INSERT INTO tenants (id, name, slug, status, tier) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, name, slug, status, tier)
    .run();

  return id;
}

export async function seedUser(
  db: D1Database,
  tenantId: string,
  overrides: Partial<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    status: string;
  }> = {},
): Promise<string> {
  const id = overrides.id ?? crypto.randomUUID();
  const email = overrides.email ?? `user-${id.slice(0, 8)}@test.com`;
  const displayName = overrides.displayName ?? "Test User";
  const role = overrides.role ?? "member";
  const status = overrides.status ?? "active";

  await db
    .prepare(
      "INSERT INTO users (id, tenant_id, email, display_name, role, status) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id, tenantId, email, displayName, role, status)
    .run();

  return id;
}
