import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { buildDefaultControls } from "$lib/compliance/framework-controls";
import { hashPasswordPBKDF2 as hashPassword } from "$lib/server/password";
import { queryPg, queryPgOne } from "$lib/server/pg";

interface RegisterBody {
  orgName: string;
  industry?: string;
  companySize?: string;
  frameworks?: string[];
  selectedApps?: string[];
  ownerName?: string;
  ownerEmail: string;
  ownerPassword: string;
  selectedIdp?: "okta" | "google_workspace" | "microsoft_365";
  selectedIdpDomain?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  const body: Partial<RegisterBody> = await request.json().catch(() => ({}));

  const {
    orgName,
    industry,
    companySize,
    frameworks,
    selectedApps,
    ownerName,
    ownerEmail,
    ownerPassword,
  } = body;

  if (!orgName || !orgName.trim()) {
    return json({ error: "Organization name is required" }, { status: 400 });
  }
  if (!ownerEmail) {
    return json({ error: "Owner email is required" }, { status: 400 });
  }
  if (!ownerPassword || ownerPassword.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const email = ownerEmail.toLowerCase().trim();
  const tenantId = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  try {
    // Check for existing org or user
    const existingTenant = await queryPgOne<{ id: string }>(
      "SELECT id FROM tenants WHERE id = $1 LIMIT 1",
      [tenantId],
    );
    if (existingTenant) {
      return json({ error: "An organization with this name already exists" }, { status: 409 });
    }

    const existingUser = await queryPgOne<{ id: string }>(
      "SELECT id FROM console_users WHERE email = $1 LIMIT 1",
      [email],
    );
    if (existingUser) {
      return json({ error: "This email is already registered" }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(ownerPassword, salt);
    const now = new Date().toISOString();

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
    const isSuperAdmin = email === superAdminEmail.toLowerCase();
    const roles = isSuperAdmin ? '["super-admin","owner","admin"]' : '["owner","admin"]';

    // Create tenant with all onboarding data
    await queryPg(
      `INSERT INTO tenants (id, name, owner_email, industry, size, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
      [tenantId, orgName.trim(), email, industry || null, companySize || null, now],
    );

    // Create owner account
    await queryPg(
      `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, email, passwordHash, salt, ownerName || null, roles, tenantId, now],
    );

    // Create linked directory user for the owner
    const directoryUserId = crypto.randomUUID();
    await queryPg(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, title, status, source, console_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
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
        now,
      ],
    );

    // Table created via migration 0026_tenant_preferences.sql
    // Store framework preferences
    if (frameworks && frameworks.length > 0) {
      await queryPg(
        `INSERT INTO tenant_preferences (tenant_id, key, value)
         VALUES ($1, 'frameworks', $2)
         ON CONFLICT (tenant_id, key) DO UPDATE SET value = $2`,
        [tenantId, JSON.stringify(frameworks)],
      );
    }

    // Auto-seed compliance controls for selected frameworks
    if (frameworks && frameworks.length > 0) {
      const controls = buildDefaultControls(frameworks);
      await queryPg(
        `INSERT INTO tenant_preferences (tenant_id, key, value)
         VALUES ($1, 'compliance_controls', $2)
         ON CONFLICT (tenant_id, key) DO UPDATE SET value = $2`,
        [tenantId, JSON.stringify(controls)],
      );
    }

    // Store selected apps
    if (selectedApps && selectedApps.length > 0) {
      await queryPg(
        `INSERT INTO tenant_preferences (tenant_id, key, value)
         VALUES ($1, 'selected_apps', $2)
         ON CONFLICT (tenant_id, key) DO UPDATE SET value = $2`,
        [tenantId, JSON.stringify(selectedApps)],
      );
    }

    // Create directory connection if IdP was selected
    const selectedIdp = body.selectedIdp;
    const selectedIdpDomain = body.selectedIdpDomain;
    if (selectedIdp && ["okta", "google_workspace", "microsoft_365"].includes(selectedIdp)) {
      await queryPg(
        `INSERT INTO directory_connections (tenant_id, provider, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (tenant_id, provider) DO NOTHING`,
        [tenantId, selectedIdp],
      );

      // Store Okta domain in app_credentials for the OAuth flow
      if (selectedIdp === "okta" && selectedIdpDomain?.trim()) {
        await queryPg(
          `INSERT INTO app_credentials (tenant_id, app_id, credentials, connected_at, updated_at)
           VALUES ($1, 'okta', $2, $3, $4)
           ON CONFLICT(tenant_id, app_id) DO UPDATE SET credentials = EXCLUDED.credentials, updated_at = EXCLUDED.updated_at`,
          [tenantId, JSON.stringify({ domain: selectedIdpDomain.trim() }), now, now],
        );
      }
    }

    return json({
      success: true,
      tenantId,
      userId,
      email,
      orgName: orgName.trim(),
    });
  } catch (e: any) {
    console.error("Organization registration error:", e);
    if (e?.message?.includes("UNIQUE")) {
      return json({ error: "Organization or email already exists" }, { status: 409 });
    }
    return json(
      { error: "Registration failed: " + (e?.message || "unknown error") },
      { status: 500 },
    );
  }
};
