/**
 * Synthetic evidence generation for quick-start onboarding.
 *
 * Generates industry-appropriate estimated evidence on tenant signup,
 * allowing users to see compliance scores immediately before connecting
 * real adapters.
 *
 * All synthetic evidence is marked with source='synthetic' and replaced
 * when real adapter evidence is collected.
 */

export interface SyntheticEvidenceConfig {
  tenantId: string;
  industry: string; // 'technology', 'healthcare', 'finance', 'retail', etc.
  employeeCount?: number;
  frameworks?: string[]; // ['SOC2', 'ISO27001', 'HIPAA', etc.]
}

export interface SyntheticEvidenceItem {
  id: string;
  tenant_id: string;
  framework: string;
  control_id: string;
  control_name?: string;
  evidence_type: string;
  source: "synthetic";
  source_id: string;
  data: {
    type: string;
    synthetic: true;
    generated_at: string;
    estimated_confidence: number;
    description: string;
    employee_count?: number;
    industry: string;
  };
  collected_at: string;
  created_at: string;
}

// Base controls that apply to all industries (SOC 2 Trust Service Criteria)
const BASE_CONTROLS = [
  {
    id: "CC6.1",
    framework: "SOC2",
    type: "access_control",
    weight: 0.7,
    name: "Logical Access Controls",
  },
  {
    id: "CC6.2",
    framework: "SOC2",
    type: "mfa_enforcement",
    weight: 0.8,
    name: "Multi-Factor Authentication",
  },
  {
    id: "CC6.3",
    framework: "SOC2",
    type: "access_termination",
    weight: 0.6,
    name: "Access Termination",
  },
  {
    id: "CC7.1",
    framework: "SOC2",
    type: "vulnerability_management",
    weight: 0.5,
    name: "Vulnerability Detection",
  },
  {
    id: "CC7.2",
    framework: "SOC2",
    type: "change_management",
    weight: 0.6,
    name: "Change Management",
  },
  {
    id: "CC7.3",
    framework: "SOC2",
    type: "system_monitoring",
    weight: 0.65,
    name: "System Monitoring",
  },
  {
    id: "CC8.1",
    framework: "SOC2",
    type: "incident_response",
    weight: 0.55,
    name: "Incident Detection",
  },
  { id: "CC9.1", framework: "SOC2", type: "risk_assessment", weight: 0.5, name: "Risk Assessment" },
];

// Industry-specific controls (HIPAA, PCI-DSS, ISO 27001)
const INDUSTRY_CONTROLS: Record<
  string,
  Array<{ id: string; framework: string; type: string; weight: number; name: string }>
> = {
  healthcare: [
    {
      id: "HIPAA-164.308(a)(1)",
      framework: "HIPAA",
      type: "risk_assessment",
      weight: 0.7,
      name: "Security Risk Assessment",
    },
    {
      id: "HIPAA-164.312(a)(1)",
      framework: "HIPAA",
      type: "access_control",
      weight: 0.8,
      name: "Access Control",
    },
    {
      id: "HIPAA-164.312(b)",
      framework: "HIPAA",
      type: "audit_controls",
      weight: 0.75,
      name: "Audit Controls",
    },
    {
      id: "HIPAA-164.312(d)",
      framework: "HIPAA",
      type: "authentication",
      weight: 0.8,
      name: "Person Authentication",
    },
    {
      id: "HIPAA-164.308(a)(5)",
      framework: "HIPAA",
      type: "workforce_security",
      weight: 0.65,
      name: "Workforce Security",
    },
  ],
  finance: [
    {
      id: "PCI-8.1",
      framework: "PCI-DSS",
      type: "user_identification",
      weight: 0.8,
      name: "User Identification",
    },
    {
      id: "PCI-8.2",
      framework: "PCI-DSS",
      type: "authentication",
      weight: 0.85,
      name: "User Authentication",
    },
    {
      id: "PCI-10.1",
      framework: "PCI-DSS",
      type: "audit_logging",
      weight: 0.7,
      name: "Audit Trail",
    },
    { id: "PCI-10.2", framework: "PCI-DSS", type: "log_review", weight: 0.6, name: "Log Review" },
    {
      id: "PCI-12.1",
      framework: "PCI-DSS",
      type: "security_policy",
      weight: 0.65,
      name: "Security Policy",
    },
  ],
  technology: [
    {
      id: "A.9.2.1",
      framework: "ISO27001",
      type: "user_registration",
      weight: 0.7,
      name: "User Registration",
    },
    {
      id: "A.9.2.2",
      framework: "ISO27001",
      type: "privilege_management",
      weight: 0.75,
      name: "Privilege Management",
    },
    {
      id: "A.12.1.1",
      framework: "ISO27001",
      type: "documented_procedures",
      weight: 0.6,
      name: "Documented Procedures",
    },
    {
      id: "A.12.4.1",
      framework: "ISO27001",
      type: "event_logging",
      weight: 0.7,
      name: "Event Logging",
    },
    {
      id: "A.18.1.1",
      framework: "ISO27001",
      type: "compliance_review",
      weight: 0.5,
      name: "Compliance Requirements",
    },
  ],
  retail: [
    {
      id: "PCI-8.1",
      framework: "PCI-DSS",
      type: "user_identification",
      weight: 0.8,
      name: "User Identification",
    },
    {
      id: "PCI-10.1",
      framework: "PCI-DSS",
      type: "audit_logging",
      weight: 0.7,
      name: "Audit Trail",
    },
    {
      id: "CC6.1",
      framework: "SOC2",
      type: "access_control",
      weight: 0.75,
      name: "Logical Access Controls",
    },
  ],
  education: [
    {
      id: "FERPA-99.31",
      framework: "FERPA",
      type: "data_disclosure",
      weight: 0.7,
      name: "Prior Consent for Disclosure",
    },
    {
      id: "FERPA-99.32",
      framework: "FERPA",
      type: "access_records",
      weight: 0.65,
      name: "Records of Disclosure",
    },
    {
      id: "CC6.1",
      framework: "SOC2",
      type: "access_control",
      weight: 0.7,
      name: "Logical Access Controls",
    },
  ],
};

/**
 * Generate synthetic compliance evidence for a new tenant.
 *
 * Evidence is marked with source='synthetic' and includes estimated
 * confidence scores based on industry benchmarks and employee count.
 *
 * @param config - Tenant configuration including industry, employee count, frameworks
 * @returns Array of synthetic evidence items ready for database insertion
 */
export function generateSyntheticEvidence(
  config: SyntheticEvidenceConfig,
): SyntheticEvidenceItem[] {
  const evidence: SyntheticEvidenceItem[] = [];
  const now = Date.now();
  const nowISO = new Date(now).toISOString();

  // Determine which frameworks to generate evidence for
  const frameworks = config.frameworks || ["SOC2"];
  const industry = config.industry.toLowerCase();
  const employeeCount = config.employeeCount || 50; // Default to 50 employees

  // Collect applicable controls
  const controls = [...BASE_CONTROLS];

  // Add industry-specific controls
  const industryControls = INDUSTRY_CONTROLS[industry] || [];
  controls.push(...industryControls);

  // Filter to only controls for requested frameworks
  const filteredControls = controls.filter((c) =>
    frameworks.some((f) => f.toUpperCase().includes(c.framework.toUpperCase())),
  );

  // Generate evidence items for each control
  for (const control of filteredControls) {
    // Generate 3-7 evidence items per control (smaller companies get fewer)
    const itemCount = Math.min(3, Math.max(3, Math.floor(employeeCount / 20)));

    for (let i = 0; i < itemCount; i++) {
      // Spread timestamps over last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const timestampISO = timestamp.toISOString();

      // Adjust confidence based on employee count (smaller companies typically have simpler setups)
      const sizeMultiplier = employeeCount < 20 ? 1.1 : employeeCount > 500 ? 0.9 : 1.0;
      const adjustedWeight = Math.min(0.95, control.weight * sizeMultiplier);

      const evidenceId = `synthetic-${config.tenantId}-${control.id}-${i}`;

      evidence.push({
        id: evidenceId,
        tenant_id: config.tenantId,
        framework: control.framework,
        control_id: control.id,
        control_name: control.name,
        evidence_type: "estimate",
        source: "synthetic",
        source_id: evidenceId,
        data: {
          type: control.type,
          synthetic: true,
          generated_at: nowISO,
          estimated_confidence: adjustedWeight,
          description: `Estimated ${control.type.replace(/_/g, " ")} evidence based on ${industry} industry profile (${employeeCount} employees)`,
          employee_count: employeeCount,
          industry,
        },
        collected_at: timestampISO,
        created_at: timestampISO,
      });
    }
  }

  return evidence;
}

/**
 * Batch insert synthetic evidence into PostgreSQL.
 *
 * Uses parameterized queries to safely insert multiple evidence items.
 * Handles conflicts by ignoring duplicates (ON CONFLICT DO NOTHING).
 *
 * @param pool - PostgreSQL connection pool
 * @param evidence - Array of synthetic evidence items to insert
 * @returns Promise that resolves when all evidence is inserted
 */
export async function insertSyntheticEvidence(
  pool: { query: (sql: string, params: unknown[]) => Promise<{ rowCount: number }> },
  evidence: SyntheticEvidenceItem[],
): Promise<{ inserted: number }> {
  if (evidence.length === 0) return { inserted: 0 };

  // PostgreSQL doesn't support batching like D1, so we use a multi-row INSERT
  const values: unknown[] = [];
  const placeholders: string[] = [];

  for (let i = 0; i < evidence.length; i++) {
    const item = evidence[i];
    const offset = i * 11; // 11 fields per row
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`,
    );
    values.push(
      item.id,
      item.tenant_id,
      item.framework,
      item.control_id,
      item.control_name || null,
      item.evidence_type,
      item.source,
      item.source_id,
      JSON.stringify(item.data),
      item.collected_at,
      item.created_at,
    );
  }

  const sql = `
    INSERT INTO compliance_evidence
      (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, data, collected_at, created_at)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (id) DO NOTHING
  `;

  const result = await pool.query(sql, values);
  return { inserted: result.rowCount };
}

/**
 * Delete synthetic evidence for specific controls when real evidence arrives.
 *
 * Called by adapters after collecting real evidence to replace estimates.
 *
 * @param pool - PostgreSQL connection pool
 * @param tenantId - Tenant ID
 * @param controlIds - Array of control IDs to clean up
 * @returns Promise that resolves when cleanup is complete
 */
export async function replaceSyntheticEvidence(
  pool: { query: (sql: string, params: unknown[]) => Promise<{ rowCount: number }> },
  tenantId: string,
  controlIds: string[],
): Promise<{ deleted: number }> {
  if (controlIds.length === 0) return { deleted: 0 };

  const result = await pool.query(
    `DELETE FROM compliance_evidence
     WHERE tenant_id = $1 AND source = 'synthetic' AND control_id = ANY($2)`,
    [tenantId, controlIds],
  );

  return { deleted: result.rowCount };
}

/**
 * Check if a tenant has any synthetic evidence.
 *
 * Used by UI to show "estimated score" banner.
 *
 * @param pool - PostgreSQL connection pool
 * @param tenantId - Tenant ID
 * @returns Promise<boolean> - true if tenant has synthetic evidence
 */
export async function hasSyntheticEvidence(
  pool: { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }> },
  tenantId: string,
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM compliance_evidence WHERE tenant_id = $1 AND source = 'synthetic' LIMIT 1`,
    [tenantId],
  );
  return result.rows.length > 0;
}
