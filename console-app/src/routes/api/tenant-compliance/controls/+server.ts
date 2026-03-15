import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface Control {
  id: string;
  framework: string;
  name: string;
  status: "not_started" | "in_progress" | "implemented" | "verified";
  notes: string;
}

const FRAMEWORK_CONTROLS: Record<string, string[]> = {
  SOC2: [
    "Access Control",
    "Change Management",
    "Incident Response",
    "Risk Assessment",
    "Vendor Management",
  ],
  ISO27001: [
    "Information Security Policy",
    "Asset Management",
    "Access Control",
    "Cryptography",
    "Physical Security",
  ],
  "NIST CSF": ["Identify", "Protect", "Detect", "Respond", "Recover"],
  HIPAA: [
    "Privacy Rule",
    "Security Rule",
    "Breach Notification",
    "Administrative Safeguards",
  ],
  GDPR: [
    "Data Mapping",
    "Consent Management",
    "Data Subject Rights",
    "DPO Appointment",
    "Breach Notification",
  ],
};

function buildDefaultControls(frameworks: string[]): Control[] {
  const controls: Control[] = [];
  for (const fw of frameworks) {
    const names = FRAMEWORK_CONTROLS[fw];
    if (!names) continue;
    for (const name of names) {
      controls.push({
        id: `${fw.toLowerCase().replace(/\s+/g, "_")}_${name.toLowerCase().replace(/\s+/g, "_")}`,
        framework: fw,
        name,
        status: "not_started",
        notes: "",
      });
    }
  }
  return controls;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  // Get tenant frameworks
  let frameworks: string[] = [];
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      frameworks = JSON.parse(row.value as string);
    }
  } catch {
    // no frameworks set
  }

  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
  }

  // Check for saved control statuses
  let controls: Control[] | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      controls = JSON.parse(row.value as string);
    }
  } catch {
    // no saved controls
  }

  if (!controls) {
    controls = buildDefaultControls(frameworks);
  }

  return json({ frameworks, controls });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { controls } = body as { controls?: Control[] };

  if (!controls || !Array.isArray(controls)) {
    return json({ error: "controls array required" }, { status: 400 });
  }

  // Validate each control
  const validStatuses = [
    "not_started",
    "in_progress",
    "implemented",
    "verified",
  ];
  for (const c of controls) {
    if (!c.id || !c.framework || !c.name || !validStatuses.includes(c.status)) {
      return json({ error: `Invalid control: ${c.id}` }, { status: 400 });
    }
  }

  await db
    .prepare(
      `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'compliance_controls', ?)`,
    )
    .bind(user.tenantId, JSON.stringify(controls))
    .run();

  return json({ success: true });
};
