import {
  DEFAULT_POLICY_TEMPLATES,
  type PolicyTemplateRecord,
} from "./templates";

export interface GeneratedPolicyRecord {
  hash: string;
  tenantId: string;
  templateKey: string;
  content: string;
  contextHash: string;
  createdAt: string;
  sizeBytes: number;
}

export interface PolicyEvaluationRecord {
  id: number;
  tenantId: string;
  policyKey: string;
  inputHash: string;
  resultHash: string;
  createdAt: string;
  result: Record<string, unknown>;
}

export interface CoverageControlRow {
  controlKey: string;
  title: string;
  evidenceCount: number;
}

export interface CoverageSummary {
  framework: string;
  totalControls: number;
  controls: CoverageControlRow[];
  coveragePercent: number;
}

const INTERNAL_CONTROLS = [
  // SOC2
  {
    key: "SOC2_CC1.1",
    framework: "SOC2",
    title: "Control environment",
    description:
      "The entity demonstrates a commitment to integrity and ethical values.",
  },
  {
    key: "SOC2_CC2.2",
    framework: "SOC2",
    title: "Communication and information",
    description:
      "The entity communicates information, including objectives and responsibilities for internal control.",
  },
  {
    key: "SOC2_CC6.1",
    framework: "SOC2",
    title: "Logical access",
    description:
      "Logical access security software, infrastructure, and architectures are implemented to protect assets.",
  },
  // ISO 27001
  {
    key: "ISO27001_A.8",
    framework: "ISO27001",
    title: "Asset management",
    description: "Inventory and classification of information assets.",
  },
  {
    key: "ISO27001_A.9",
    framework: "ISO27001",
    title: "Access control",
    description:
      "Restrict access to information and information processing facilities.",
  },
  {
    key: "ISO27001_A.10",
    framework: "ISO27001",
    title: "Cryptography",
    description:
      "Ensure proper and effective use of cryptography to protect information.",
  },
  {
    key: "ISO27001_A.16",
    framework: "ISO27001",
    title: "Incident management",
    description: "Manage information security incidents effectively.",
  },
  // NIST CSF
  {
    key: "NIST_ID",
    framework: "NIST CSF",
    title: "Identify",
    description:
      "Develop organizational understanding to manage cybersecurity risk.",
  },
  {
    key: "NIST_PR",
    framework: "NIST CSF",
    title: "Protect",
    description: "Develop and implement appropriate safeguards.",
  },
  {
    key: "NIST_DE",
    framework: "NIST CSF",
    title: "Detect",
    description:
      "Develop and implement activities to identify cybersecurity events.",
  },
  {
    key: "NIST_RS",
    framework: "NIST CSF",
    title: "Respond",
    description:
      "Develop and implement activities to take action on detected events.",
  },
  {
    key: "NIST_RC",
    framework: "NIST CSF",
    title: "Recover",
    description: "Develop and implement activities to restore capabilities.",
  },
];

const CONTROL_POLICY_MAPPINGS = [
  // SOC2
  { controlKey: "SOC2_CC1.1", policyKey: "soc2.demo", framework: "SOC2" },
  { controlKey: "SOC2_CC2.2", policyKey: "soc2.demo", framework: "SOC2" },
  { controlKey: "SOC2_CC6.1", policyKey: "soc2.demo", framework: "SOC2" },
  // ISO 27001
  {
    controlKey: "ISO27001_A.8",
    policyKey: "iso27001.isms",
    framework: "ISO27001",
  },
  {
    controlKey: "ISO27001_A.9",
    policyKey: "iso27001.isms",
    framework: "ISO27001",
  },
  {
    controlKey: "ISO27001_A.10",
    policyKey: "iso27001.isms",
    framework: "ISO27001",
  },
  {
    controlKey: "ISO27001_A.16",
    policyKey: "iso27001.isms",
    framework: "ISO27001",
  },
  // NIST CSF
  { controlKey: "NIST_ID", policyKey: "nist.csf", framework: "NIST CSF" },
  { controlKey: "NIST_PR", policyKey: "nist.csf", framework: "NIST CSF" },
  { controlKey: "NIST_DE", policyKey: "nist.csf", framework: "NIST CSF" },
  { controlKey: "NIST_RS", policyKey: "nist.csf", framework: "NIST CSF" },
  { controlKey: "NIST_RC", policyKey: "nist.csf", framework: "NIST CSF" },
];

export async function ensurePolicySchema(db: D1Database) {
  // D1 db.exec() can fail with multi-statement SQL.
  // Use individual prepare().run() calls for reliability.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS policy_templates (
         key TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         format TEXT NOT NULL,
         body TEXT NOT NULL,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS generated_policies (
         hash TEXT PRIMARY KEY,
         tenant_id TEXT NOT NULL,
         template_key TEXT NOT NULL,
         content TEXT NOT NULL,
         context_hash TEXT NOT NULL,
         input_canonical TEXT NOT NULL,
         created_at TEXT NOT NULL,
         size_bytes INTEGER DEFAULT 0
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_context
         ON generated_policies (tenant_id, template_key, context_hash)`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS policy_evaluations (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         tenant_id TEXT NOT NULL,
         policy_key TEXT NOT NULL,
         input_hash TEXT NOT NULL,
         result_hash TEXT NOT NULL,
         result_json TEXT NOT NULL,
         created_at TEXT NOT NULL
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS internal_controls (
         control_key TEXT PRIMARY KEY,
         framework TEXT NOT NULL,
         title TEXT NOT NULL,
         description TEXT
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS control_mappings (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         control_key TEXT NOT NULL,
         policy_key TEXT NOT NULL,
         framework TEXT NOT NULL,
         UNIQUE(control_key, policy_key)
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS control_evidence_links (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         control_key TEXT NOT NULL,
         tenant_id TEXT NOT NULL,
         evidence_hash TEXT NOT NULL,
         created_at TEXT NOT NULL,
         UNIQUE(control_key, tenant_id, evidence_hash)
       )`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_control_links_control_tenant
         ON control_evidence_links (control_key, tenant_id)`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_control_links_tenant_control
         ON control_evidence_links (tenant_id, control_key)`,
    )
    .run();
}

export async function seedPolicyData(db: D1Database) {
  const now = new Date().toISOString();
  for (const template of DEFAULT_POLICY_TEMPLATES) {
    await db
      .prepare(
        `INSERT INTO policy_templates (key, name, format, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           name = excluded.name,
           format = excluded.format,
           body = excluded.body,
           updated_at = excluded.updated_at`,
      )
      .bind(
        template.key,
        template.name,
        template.format,
        template.body,
        now,
        now,
      )
      .run();
  }

  for (const control of INTERNAL_CONTROLS) {
    await db
      .prepare(
        `INSERT INTO internal_controls (control_key, framework, title, description)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(control_key) DO UPDATE SET
           framework = excluded.framework,
           title = excluded.title,
           description = excluded.description`,
      )
      .bind(control.key, control.framework, control.title, control.description)
      .run();
  }

  for (const mapping of CONTROL_POLICY_MAPPINGS) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO control_mappings (control_key, policy_key, framework)
         VALUES (?, ?, ?)`,
      )
      .bind(mapping.controlKey, mapping.policyKey, mapping.framework)
      .run();
  }
}

export async function listPolicyTemplates(
  db: D1Database,
): Promise<PolicyTemplateRecord[]> {
  const rows = await db
    .prepare(
      `SELECT key, name, format, body FROM policy_templates ORDER BY key ASC`,
    )
    .all<{ key: string; name: string; format: string; body: string }>();
  return (rows.results ?? []).map((row) => ({
    key: row.key,
    name: row.name,
    format: row.format as PolicyTemplateRecord["format"],
    body: row.body,
  }));
}

export async function getPolicyTemplate(
  db: D1Database,
  key: string,
): Promise<PolicyTemplateRecord | null> {
  const row = await db
    .prepare(
      `SELECT key, name, format, body FROM policy_templates WHERE key = ? LIMIT 1`,
    )
    .bind(key)
    .first<{ key: string; name: string; format: string; body: string }>();
  if (!row) return null;
  return {
    key: row.key,
    name: row.name,
    format: row.format as PolicyTemplateRecord["format"],
    body: row.body,
  };
}

function calculateContentSize(content: string | null | undefined): number {
  return new TextEncoder().encode(content ?? "").byteLength;
}

export async function findGeneratedPolicyByContext(
  db: D1Database,
  tenantId: string,
  templateKey: string,
  contextHash: string,
): Promise<GeneratedPolicyRecord | null> {
  const row = await db
    .prepare(
      `SELECT hash, tenant_id, template_key, content, context_hash, created_at, size_bytes
       FROM generated_policies
       WHERE tenant_id = ? AND template_key = ? AND context_hash = ?
       LIMIT 1`,
    )
    .bind(tenantId, templateKey, contextHash)
    .first<{
      hash: string;
      tenant_id: string;
      template_key: string;
      content: string;
      context_hash: string;
      created_at: string;
      size_bytes: number | null;
    }>();
  if (!row) return null;
  return {
    hash: row.hash,
    tenantId: row.tenant_id,
    templateKey: row.template_key,
    content: row.content,
    contextHash: row.context_hash,
    createdAt: row.created_at,
    sizeBytes: row.size_bytes ?? calculateContentSize(row.content),
  };
}

export async function saveGeneratedPolicy(
  db: D1Database,
  record: GeneratedPolicyRecord,
  inputCanonical: string,
) {
  await db
    .prepare(
      `INSERT INTO generated_policies (
         hash, tenant_id, template_key, content, context_hash,
         input_canonical, created_at, size_bytes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(hash) DO UPDATE SET
         tenant_id = excluded.tenant_id,
         template_key = excluded.template_key,
         content = excluded.content,
         context_hash = excluded.context_hash,
         input_canonical = excluded.input_canonical,
         created_at = excluded.created_at,
         size_bytes = excluded.size_bytes`,
    )
    .bind(
      record.hash,
      record.tenantId,
      record.templateKey,
      record.content,
      record.contextHash,
      inputCanonical,
      record.createdAt,
      record.sizeBytes,
    )
    .run();
}

export async function recordPolicyEvaluation(
  db: D1Database,
  data: {
    tenantId: string;
    policyKey: string;
    inputHash: string;
    resultHash: string;
    resultCanonical: string;
  },
) {
  await db
    .prepare(
      `INSERT INTO policy_evaluations (
         tenant_id, policy_key, input_hash, result_hash, result_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.tenantId,
      data.policyKey,
      data.inputHash,
      data.resultHash,
      data.resultCanonical,
      new Date().toISOString(),
    )
    .run();
}

export async function upsertControlEvidenceLink(
  db: D1Database,
  controlKey: string,
  evidenceHash: string,
  tenantId: string,
): Promise<{ created: boolean; createdAt: string }> {
  const createdAt = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO control_evidence_links (control_key, tenant_id, evidence_hash, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(controlKey, tenantId, evidenceHash, createdAt)
    .run();

  const created = (result.meta?.changes ?? 0) > 0;
  if (created) {
    return { created: true, createdAt };
  }

  const existing = await db
    .prepare(
      `SELECT created_at FROM control_evidence_links
       WHERE control_key = ? AND tenant_id = ? AND evidence_hash = ?
       LIMIT 1`,
    )
    .bind(controlKey, tenantId, evidenceHash)
    .first<{ created_at: string }>();

  return {
    created: false,
    createdAt: existing?.created_at ?? createdAt,
  };
}

export async function getCoverage(
  db: D1Database,
  framework: string,
  tenantId: string,
): Promise<CoverageSummary> {
  const controls = await db
    .prepare(
      `SELECT c.control_key as key, c.title as title,
              COALESCE(l.count, 0) as evidence_count
       FROM internal_controls c
       LEFT JOIN (
         SELECT control_key, COUNT(*) as count
         FROM control_evidence_links
         WHERE tenant_id = ?
         GROUP BY control_key
       ) l ON l.control_key = c.control_key
       WHERE c.framework = ?
       ORDER BY c.control_key ASC`,
    )
    .bind(tenantId, framework)
    .all<{ key: string; title: string; evidence_count: number }>();

  const controlsRows = (controls.results ?? []).map((row) => ({
    controlKey: row.key,
    title: row.title,
    evidenceCount: row.evidence_count ?? 0,
  }));

  const totalControls = controlsRows.length;
  const withEvidence = controlsRows.filter((r) => r.evidenceCount > 0).length;
  const coveragePercent =
    totalControls === 0 ? 0 : Math.round((withEvidence / totalControls) * 100);

  return {
    framework,
    totalControls,
    controls: controlsRows,
    coveragePercent,
  };
}

export async function findControlKeyByCandidates(
  db: D1Database,
  candidates: string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    const row = await db
      .prepare(
        `SELECT control_key FROM internal_controls WHERE control_key = ? LIMIT 1`,
      )
      .bind(candidate)
      .first<{ control_key: string }>();
    if (row?.control_key) {
      return row.control_key;
    }
  }
  return null;
}
