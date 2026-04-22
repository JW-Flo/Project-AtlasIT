import { json } from '@sveltejs/kit';
import { b as buildDefaultControls } from './framework-controls-w9ucJmdS.js';
import { h as hashPasswordPBKDF2 } from './password-DUgJgP1B.js';

const POST = async ({ request, platform }) => {
  const env = platform?.env || {};
  const body = await request.json().catch(() => ({}));
  const {
    orgName,
    industry,
    companySize,
    frameworks,
    selectedApps,
    ownerName,
    ownerEmail,
    ownerPassword
  } = body;
  if (!orgName || !orgName.trim()) {
    return json({ error: "Organization name is required" }, { status: 400 });
  }
  if (!ownerEmail) {
    return json({ error: "Owner email is required" }, { status: 400 });
  }
  if (!ownerPassword || ownerPassword.length < 8) {
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  const db = env.ATLAS_SHARED_DB;
  if (!db) {
    return json(
      { error: "Registration unavailable (no database)" },
      { status: 503 }
    );
  }
  const email = ownerEmail.toLowerCase().trim();
  const tenantId = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  try {
    const existingTenant = await db.prepare("SELECT id FROM tenants WHERE id = ? LIMIT 1").bind(tenantId).first();
    if (existingTenant) {
      return json(
        { error: "An organization with this name already exists" },
        { status: 409 }
      );
    }
    const existingUser = await db.prepare("SELECT id FROM console_users WHERE email = ? LIMIT 1").bind(email).first();
    if (existingUser) {
      return json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }
    const userId = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await hashPasswordPBKDF2(ownerPassword, salt);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isSuperAdmin = email === (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    const roles = isSuperAdmin ? '["super-admin","owner","admin"]' : '["owner","admin"]';
    await db.prepare(
      `INSERT INTO tenants (id, name, owner_email, industry, size, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`
    ).bind(
      tenantId,
      orgName.trim(),
      email,
      industry || null,
      companySize || null,
      now
    ).run();
    await db.prepare(
      `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      email,
      passwordHash,
      salt,
      ownerName || null,
      roles,
      tenantId,
      now
    ).run();
    const directoryUserId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, title, status, source, console_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      directoryUserId,
      tenantId,
      "local:" + userId,
      email,
      ownerName || email,
      "Owner",
      "active",
      "local",
      userId,
      now,
      now
    ).run();
    if (frameworks && frameworks.length > 0) {
      await db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'frameworks', ?)`
      ).bind(tenantId, JSON.stringify(frameworks)).run();
    }
    if (frameworks && frameworks.length > 0) {
      const controls = buildDefaultControls(frameworks);
      await db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`
      ).bind(tenantId, JSON.stringify(controls)).run();
    }
    if (selectedApps && selectedApps.length > 0) {
      await db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'selected_apps', ?)`
      ).bind(tenantId, JSON.stringify(selectedApps)).run();
    }
    const selectedIdp = body.selectedIdp;
    const selectedIdpDomain = body.selectedIdpDomain;
    if (selectedIdp && ["okta", "google_workspace", "microsoft_365"].includes(selectedIdp)) {
      await db.prepare(
        `INSERT OR IGNORE INTO directory_connections (tenant_id, provider, status)
           VALUES (?, ?, 'pending')`
      ).bind(tenantId, selectedIdp).run();
      if (selectedIdp === "okta" && selectedIdpDomain?.trim()) {
        await db.prepare(
          `INSERT INTO app_credentials (tenant_id, app_id, credentials, connected_at, updated_at)
             VALUES (?, 'okta', ?, ?, ?)
             ON CONFLICT(tenant_id, app_id) DO UPDATE SET credentials = excluded.credentials, updated_at = excluded.updated_at`
        ).bind(
          tenantId,
          JSON.stringify({ domain: selectedIdpDomain.trim() }),
          now,
          now
        ).run();
      }
    }
    return json({
      success: true,
      tenantId,
      userId,
      email,
      orgName: orgName.trim()
    });
  } catch (e) {
    console.error("Organization registration error:", e);
    if (e?.message?.includes("UNIQUE")) {
      return json(
        { error: "Organization or email already exists" },
        { status: 409 }
      );
    }
    return json(
      { error: "Registration failed: " + (e?.message || "unknown error") },
      { status: 500 }
    );
  }
};

export { POST };
//# sourceMappingURL=_server.ts-qJ9d3cd_.js.map
