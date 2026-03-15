import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { buildDefaultControls } from "$lib/compliance/framework-controls";

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const hex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2$100000$${hex}`;
}

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

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = (platform?.env as any) || {};
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
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const db = env.ATLAS_SHARED_DB;
  if (!db) {
    return json(
      { error: "Registration unavailable (no database)" },
      { status: 503 },
    );
  }

  const email = ownerEmail.toLowerCase().trim();
  const tenantId = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  try {
    // Check for existing org or user
    const existingTenant = await db
      .prepare("SELECT id FROM tenants WHERE id = ? LIMIT 1")
      .bind(tenantId)
      .first();
    if (existingTenant) {
      return json(
        { error: "An organization with this name already exists" },
        { status: 409 },
      );
    }

    const existingUser = await db
      .prepare("SELECT id FROM console_users WHERE email = ? LIMIT 1")
      .bind(email)
      .first();
    if (existingUser) {
      return json(
        { error: "This email is already registered" },
        { status: 409 },
      );
    }

    const userId = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(ownerPassword, salt);
    const now = new Date().toISOString();

    const isSuperAdmin = email === (env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    const roles = isSuperAdmin
      ? '["super-admin","owner","admin"]'
      : '["owner","admin"]';

    // Create tenant with all onboarding data
    await db
      .prepare(
        `INSERT INTO tenants (id, name, owner_email, industry, size, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      )
      .bind(
        tenantId,
        orgName.trim(),
        email,
        industry || null,
        companySize || null,
        now,
      )
      .run();

    // Create owner account
    await db
      .prepare(
        `INSERT INTO console_users (id, email, password_hash, salt, display_name, roles, tenant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        userId,
        email,
        passwordHash,
        salt,
        ownerName || null,
        roles,
        tenantId,
        now,
      )
      .run();

    // Ensure preferences table exists
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS tenant_preferences (
           tenant_id TEXT NOT NULL,
           key TEXT NOT NULL,
           value TEXT NOT NULL,
           PRIMARY KEY (tenant_id, key)
         )`,
      )
      .run();

    // Store framework preferences
    if (frameworks && frameworks.length > 0) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'frameworks', ?)`,
        )
        .bind(tenantId, JSON.stringify(frameworks))
        .run();
    }

    // Auto-seed compliance controls for selected frameworks
    if (frameworks && frameworks.length > 0) {
      const controls = buildDefaultControls(frameworks);
      await db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`,
        )
        .bind(tenantId, JSON.stringify(controls))
        .run();
    }

    // Store selected apps
    if (selectedApps && selectedApps.length > 0) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'selected_apps', ?)`,
        )
        .bind(tenantId, JSON.stringify(selectedApps))
        .run();
    }

    // Create directory connection if IdP was selected
    const selectedIdp = body.selectedIdp;
    const selectedIdpDomain = body.selectedIdpDomain;
    if (
      selectedIdp &&
      ["okta", "google_workspace", "microsoft_365"].includes(selectedIdp)
    ) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO directory_connections (tenant_id, provider, status)
           VALUES (?, ?, 'pending')`,
        )
        .bind(tenantId, selectedIdp)
        .run();

      // Store Okta domain in app_credentials for the OAuth flow
      if (selectedIdp === "okta" && selectedIdpDomain?.trim()) {
        await db
          .prepare(
            `INSERT OR REPLACE INTO app_credentials (tenant_id, app_id, credentials, created_at)
             VALUES (?, 'okta', ?, ?)`,
          )
          .bind(
            tenantId,
            JSON.stringify({ domain: selectedIdpDomain.trim() }),
            now,
          )
          .run();
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
      return json(
        { error: "Organization or email already exists" },
        { status: 409 },
      );
    }
    return json(
      { error: "Registration failed: " + (e?.message || "unknown error") },
      { status: 500 },
    );
  }
};
