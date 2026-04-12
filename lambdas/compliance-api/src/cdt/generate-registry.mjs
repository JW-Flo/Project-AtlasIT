#!/usr/bin/env node
// One-off codegen: reads rules/*.ts, emits registry.ts + seed SQL
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = join(__dirname, "rules");

const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".ts")).sort();

// Friendly framework labels + pack IDs
// Pack IDs match existing rows in compliance_packs (migrated from CF D1)
const FRAMEWORK = {
  soc2: { label: "SOC 2 Type II", pack: "pack-soc2-builtin" },
  iso: { label: "ISO 27001:2022", pack: "pack-iso27001-builtin" },
  nist: { label: "NIST CSF 2.0", pack: "pack-nist-csf-builtin" },
  hipaa: { label: "HIPAA Security Rule", pack: "pack-hipaa-builtin" },
  gdpr: { label: "GDPR", pack: "pack-gdpr-builtin" },
};

// Short human titles for the common controls (fallback uses the control ref)
const TITLES = {
  "SOC2-CC1.1": "Control Environment — Integrity & Ethics",
  "SOC2-CC1.2": "Board Independence & Oversight",
  "SOC2-CC1.3": "Management Authority & Responsibility",
  "SOC2-CC2.1": "Internal Communication of Objectives",
  "SOC2-CC2.2": "External Communication of Objectives",
  "SOC2-CC3.1": "Risk Assessment — Objectives Specified",
  "SOC2-CC3.2": "Risk Identification & Analysis",
  "SOC2-CC4.1": "Control Activities — Selected & Developed",
  "SOC2-CC4.2": "Control Activities — Deployed Through Policies",
  "SOC2-CC5.1": "Control Activities Over Technology",
  "SOC2-CC5.2": "Policies & Procedures Established",
  "SOC2-CC5.3": "Policies Deployed Through Management",
  "SOC2-CC6.1": "Logical Access — Least Privilege",
  "SOC2-CC6.2": "New User Access Authorization",
  "SOC2-CC6.3": "Role-Based Access Modification",
  "SOC2-CC6.6": "External Access Points Protected",
  "SOC2-CC6.7": "Data Transmission Protection",
  "SOC2-CC6.8": "Prevention of Unauthorized Software",
  "SOC2-CC7.1": "Detection of Configuration Changes",
  "SOC2-CC7.2": "Monitoring System Components",
  "SOC2-CC7.3": "Security Event Evaluation",
  "SOC2-CC7.4": "Security Incident Response",
  "SOC2-CC7.5": "Recovery from Security Incidents",
  "SOC2-CC8.1": "Change Management Process",
  "SOC2-CC9.1": "Business Disruption Risk Mitigation",
  "SOC2-CC9.2": "Vendor & Business Partner Management",
  "ISO-A5.1.1": "Information Security Policies",
  "ISO-A9.1.1": "Access Control Policy",
  "ISO-A9.1.2": "Access to Networks & Network Services",
  "ISO-A9.2.1": "User Registration & De-registration",
  "ISO-A9.2.2": "User Access Provisioning",
  "ISO-A9.2.3": "Privileged Access Rights",
  "ISO-A9.2.4": "Management of Secret Authentication",
  "ISO-A9.2.5": "Review of User Access Rights",
  "ISO-A9.2.6": "Removal/Adjustment of Access Rights",
  "ISO-A9.3.1": "Use of Secret Authentication Information",
  "ISO-A9.4.1": "Information Access Restriction",
  "ISO-A9.4.2": "Secure Log-on Procedures",
  "ISO-A12.6.1": "Management of Technical Vulnerabilities",
  "ISO-A13.1.1": "Network Controls",
  "ISO-A16.1.1": "Incident Response Responsibilities",
  "ISO-A16.1.2": "Reporting Information Security Events",
  "ISO-A16.1.4": "Assessment of Security Events",
  "NIST-PR.AC-1": "Identities & Credentials Managed",
  "NIST-PR.AC-3": "Remote Access Managed",
  "NIST-PR.AC-4": "Access Permissions & Authorizations",
  "NIST-PR.AC-7": "Users/Devices/Assets Authenticated",
  "NIST-PR.IP-3": "Configuration Change Control",
  "NIST-DE.CM-1": "Network Monitored for Events",
  "NIST-RS.CO-2": "Incidents Reported",
  "HIPAA-164.312.a1": "Access Control — Unique User Identification",
  "HIPAA-164.312.a2i": "Emergency Access Procedure",
  "HIPAA-164.312.a2ii": "Automatic Logoff",
  "HIPAA-164.312.a2iv": "Encryption & Decryption",
  "HIPAA-164.312.b": "Audit Controls",
  "HIPAA-164.312.c1": "Integrity Controls",
  "HIPAA-164.312.d": "Person or Entity Authentication",
  "GDPR-Art5.1a": "Lawfulness, Fairness, Transparency",
  "GDPR-Art5.1b": "Purpose Limitation",
  "GDPR-Art5.1c": "Data Minimisation",
  "GDPR-Art5.1d": "Accuracy",
  "GDPR-Art5.1e": "Storage Limitation",
  "GDPR-Art5.1f": "Integrity & Confidentiality",
  "GDPR-Art5.2": "Accountability",
};

// Event-type hints per framework — what kind of events typically feed these rules
const EVENT_TYPES = {
  soc2: ["access.provisioned", "access.revoked", "policy.updated", "incident.reported", "change.deployed", "vendor.assessed"],
  iso: ["access.provisioned", "access.reviewed", "vulnerability.scanned", "incident.reported"],
  nist: ["access.provisioned", "device.authenticated", "network.monitored", "incident.reported"],
  hipaa: ["access.provisioned", "session.timeout", "data.encrypted", "audit.logged"],
  gdpr: ["data.collected", "data.purposed", "data.retained", "data.deleted"],
};

function fileToControlId(base) {
  // gdpr.art5_1a  → GDPR-Art5.1a
  // hipaa.164_312_a1 → HIPAA-164.312.a1
  // iso.a9_2_1    → ISO-A9.2.1
  // nist.pr_ac_1  → NIST-PR.AC-1
  // soc2.cc6_1    → SOC2-CC6.1
  const [fw, ...rest] = base.split(".");
  const tail = rest.join(".");
  if (fw === "soc2") {
    // cc6_1 → CC6.1
    return `SOC2-${tail.replace(/^cc(\d+)_(\d+)$/i, "CC$1.$2").toUpperCase()}`;
  }
  if (fw === "iso") {
    // a9_2_1 → A9.2.1
    return `ISO-${tail.toUpperCase().replace(/_/g, ".")}`;
  }
  if (fw === "hipaa") {
    // 164_312_a1 → 164.312.a1
    return `HIPAA-${tail.replace(/_/g, ".")}`;
  }
  if (fw === "nist") {
    // pr_ac_1 → PR.AC-1  (pr_ip_3 → PR.IP-3, de_cm_1 → DE.CM-1, rs_co_2 → RS.CO-2)
    const m = tail.match(/^([a-z]+)_([a-z]+)_(\d+)$/i);
    if (m) return `NIST-${m[1].toUpperCase()}.${m[2].toUpperCase()}-${m[3]}`;
    return `NIST-${tail.toUpperCase()}`;
  }
  if (fw === "gdpr") {
    // art5_1a → Art5.1a    art5_2 → Art5.2
    return `GDPR-${tail.replace(/^art/i, "Art").replace(/_/g, ".")}`;
  }
  return base.toUpperCase();
}

function frameworkOf(base) {
  return base.split(".")[0];
}

const entries = files.map((file) => {
  const base = file.replace(/\.ts$/, "");
  const src = readFileSync(join(RULES_DIR, file), "utf8");
  const fnMatch = src.match(/export function (eval[A-Za-z0-9_]+)/);
  if (!fnMatch) throw new Error(`no export in ${file}`);
  const fnName = fnMatch[1];
  const fw = frameworkOf(base);
  const controlId = fileToControlId(base);
  const title = TITLES[controlId] ?? controlId;
  return { file, base, fnName, fw, controlId, title };
});

// --- registry.ts ---
const imports = entries.map((e) => `import { ${e.fnName} } from "./rules/${e.base}.js";`).join("\n");
const mapEntries = entries.map((e) => `  "${e.controlId}": { fn: ${e.fnName}, framework: "${FRAMEWORK[e.fw].label}", pack: "${FRAMEWORK[e.fw].pack}", title: ${JSON.stringify(e.title)} }`).join(",\n");

const registryTs = `// AUTO-GENERATED by generate-registry.mjs — do not edit by hand
import type { CdtEvent } from "./models.js";
${imports}

export type RuleDecision = { decision: "pass" | "fail" | "unknown"; rationale: string[]; references: string[] };
export type ControlRule = { fn: (ev: CdtEvent) => RuleDecision; framework: string; pack: string; title: string };

export const CONTROL_REGISTRY: Record<string, ControlRule> = {
${mapEntries}
};

export function listControls(): Array<{ controlId: string; framework: string; pack: string; title: string }> {
  return Object.entries(CONTROL_REGISTRY).map(([controlId, c]) => ({
    controlId, framework: c.framework, pack: c.pack, title: c.title,
  }));
}

export function evaluate(controlId: string, ev: CdtEvent): RuleDecision | null {
  const rule = CONTROL_REGISTRY[controlId];
  if (!rule) return null;
  return rule.fn(ev);
}
`;

writeFileSync(join(__dirname, "registry.ts"), registryTs);

// --- Seed SQL ---
// Group by framework → pack
const packs = {};
for (const e of entries) {
  const p = FRAMEWORK[e.fw];
  packs[p.pack] ??= { id: p.pack, label: p.label, fw: e.fw, controls: [] };
  packs[p.pack].controls.push(e);
}

const controlRows = entries.map((e) => {
  const pack = FRAMEWORK[e.fw].pack;
  const safeTitle = e.title.replace(/'/g, "''");
  return `  ('${pack}', '${e.controlId}', '${safeTitle}', '${e.fnName}')`;
}).join(",\n");

const seedSql = `-- AUTO-GENERATED: wire CDT rules onto existing compliance_packs + controls
-- Pre-existing tables: compliance_packs, compliance_pack_controls (both have TEXT ids, migrated from CF D1)
-- This migration creates: tenant_compliance_packs, tenant_control_state (per-tenant evaluation state)
-- and UPSERTs ${entries.length} CDT-backed controls across ${Object.keys(packs).length} packs.

CREATE TABLE IF NOT EXISTS tenant_compliance_packs (
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_evaluated_at TIMESTAMPTZ,
  pass_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  unknown_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, pack_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_packs_tenant ON tenant_compliance_packs(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_control_state (
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  control_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'unknown',
  rationale TEXT[] NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ,
  evidence_sample_size INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, pack_id, control_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_control_state_tenant ON tenant_control_state(tenant_id);

INSERT INTO compliance_pack_controls (pack_id, control_id, title, rule_fn) VALUES
${controlRows}
ON CONFLICT (pack_id, control_id) DO UPDATE SET
  title = EXCLUDED.title,
  rule_fn = EXCLUDED.rule_fn;

-- Refresh controls_count on each pack to reflect real seeded count
UPDATE compliance_packs p SET controls_count = (
  SELECT COUNT(*) FROM compliance_pack_controls c WHERE c.pack_id = p.id
) WHERE p.id IN ('pack-soc2-builtin','pack-iso27001-builtin','pack-nist-csf-builtin','pack-hipaa-builtin','pack-gdpr-builtin');
`;

writeFileSync(join(__dirname, "..", "..", "..", "..", "migrations", "0052_compliance_packs_seed.sql"), seedSql);

console.log(`Wrote registry.ts (${entries.length} rules)`);
console.log(`Wrote migrations/0052_compliance_packs_seed.sql (${Object.keys(packs).length} packs, ${entries.length} controls)`);
