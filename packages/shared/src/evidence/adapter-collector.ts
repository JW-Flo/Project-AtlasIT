/**
 * Adapter evidence collector — pulls compliance-relevant configuration
 * from connected adapters to generate evidence artifacts.
 *
 * Each adapter exposes a `/api/evidence` endpoint that returns
 * configuration state relevant to compliance controls.
 */

export interface AdapterEvidenceConfig {
  slug: string;
  evidenceTypes: AdapterEvidenceType[];
}

export interface AdapterEvidenceType {
  type: string;
  controlRefs: string[];
  description: string;
}

export interface AdapterEvidenceResult {
  slug: string;
  collectedAt: string;
  items: AdapterEvidenceItem[];
  /** Non-null when the adapter returned an error or was unreachable */
  error?: string;
}

export interface AdapterEvidenceItem {
  type: string;
  controlRefs: string[];
  status: "pass" | "fail" | "unknown";
  details: Record<string, unknown>;
}

/**
 * Registry of adapter evidence collection capabilities.
 * Maps adapter slug → evidence types with compliance control references.
 */
export const ADAPTER_EVIDENCE_REGISTRY: AdapterEvidenceConfig[] = [
  {
    slug: "github",
    evidenceTypes: [
      {
        type: "branch_protection",
        controlRefs: ["SOC2-CC8.1", "ISO-27001-A.12.6.1"],
        description: "Branch protection rules on default branches",
      },
      {
        type: "mfa_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        description: "MFA enforcement for org members",
      },
      {
        type: "sso_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
        description: "SSO enforcement for org",
      },
    ],
  },
  {
    slug: "okta",
    evidenceTypes: [
      {
        type: "mfa_policy",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        description: "MFA policy enforcement",
      },
      {
        type: "password_policy",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1"],
        description: "Password complexity and rotation policy",
      },
      {
        type: "session_policy",
        controlRefs: ["SOC2-CC6.7", "ISO-27001-A.9.4.2"],
        description: "Session timeout and inactivity controls",
      },
    ],
  },
  {
    slug: "google-workspace",
    evidenceTypes: [
      {
        type: "mfa_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        description: "2-Step Verification enforcement",
      },
      {
        type: "dlp_rules",
        controlRefs: ["SOC2-CC6.7", "GDPR-Art.5(1)(f)"],
        description: "Data loss prevention rules active",
      },
      {
        type: "sharing_settings",
        controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.1.2"],
        description: "External sharing restrictions",
      },
    ],
  },
  {
    slug: "microsoft-365",
    evidenceTypes: [
      {
        type: "mfa_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2", "HIPAA-164.312(d)"],
        description: "MFA enforcement via Conditional Access",
      },
      {
        type: "conditional_access",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.1"],
        description: "Conditional Access policies active",
      },
      {
        type: "encryption_status",
        controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
        description: "Data encryption at rest (BitLocker, Azure)",
      },
    ],
  },
  {
    slug: "aws",
    evidenceTypes: [
      {
        type: "mfa_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.4.2"],
        description: "MFA enforcement for IAM users",
      },
      {
        type: "encryption_at_rest",
        controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(ii)", "GDPR-Art.5(1)(f)"],
        description: "S3/EBS/RDS encryption at rest",
      },
      {
        type: "cloudtrail_enabled",
        controlRefs: ["SOC2-CC7.1", "HIPAA-164.312(b)", "NIST-CSF-DE.CM-1"],
        description: "CloudTrail logging enabled",
      },
    ],
  },
  {
    slug: "slack",
    evidenceTypes: [
      {
        type: "sso_enforcement",
        controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.2.1"],
        description: "SSO enforcement for workspace",
      },
      {
        type: "retention_policy",
        controlRefs: ["GDPR-Art.5(1)(e)", "SOC2-CC6.6"],
        description: "Message retention policy",
      },
    ],
  },
  // TODO: jira adapter lacks /api/evidence endpoint — registry entry ready for when it's added
  {
    slug: "jira",
    evidenceTypes: [
      {
        type: "project_permissions",
        controlRefs: ["SOC2-CC6.3", "SOC2-CC8.1", "ISO-27001-A.9.1.2"],
        description: "Project permission schemes and change management",
      },
    ],
  },
  // TODO: confluence adapter lacks /api/evidence endpoint — registry entry ready for when it's added
  {
    slug: "confluence",
    evidenceTypes: [
      {
        type: "space_permissions",
        controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.1.2", "GDPR-Art.5(1)(f)"],
        description: "Space permissions and page restrictions",
      },
    ],
  },
  // TODO: bamboohr adapter lacks /api/evidence endpoint — registry entry ready for when it's added
  {
    slug: "bamboohr",
    evidenceTypes: [
      {
        type: "employee_lifecycle",
        controlRefs: ["ISO-27001-A.9.2.1", "SOC2-CC6.2", "NIST-CSF-PR.AC-1"],
        description: "Employee lifecycle event tracking",
      },
    ],
  },
];

/**
 * Collect evidence from a single adapter by calling its /api/evidence endpoint.
 */
export async function collectAdapterEvidence(
  adapterUrl: string,
  slug: string,
  tenantId: string,
): Promise<AdapterEvidenceResult> {
  const collectedAt = new Date().toISOString();
  try {
    const res = await fetch(`${adapterUrl}/api/evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      body: JSON.stringify({ tenantId }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const error = `${slug} returned ${res.status}: ${body.slice(0, 200)}`;
      console.warn(`[evidence] ${error}`);
      return { slug, collectedAt, items: [], error };
    }

    const data = (await res.json()) as { items?: AdapterEvidenceItem[] };
    return { slug, collectedAt, items: data.items ?? [] };
  } catch (err) {
    const error = `${slug} unreachable: ${err instanceof Error ? err.message : String(err)}`;
    console.warn(`[evidence] ${error}`);
    return { slug, collectedAt, items: [], error };
  }
}

/**
 * Collect evidence from all configured adapters for a tenant.
 */
export async function collectAllAdapterEvidence(
  adapterUrls: Record<string, string>,
  tenantId: string,
): Promise<AdapterEvidenceResult[]> {
  const configs = ADAPTER_EVIDENCE_REGISTRY.filter((c) => adapterUrls[c.slug]);

  const results = await Promise.allSettled(
    configs.map((c) => collectAdapterEvidence(adapterUrls[c.slug], c.slug, tenantId)),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<AdapterEvidenceResult> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ── Control ref parsing ────────────────────────────────────────────────────

/**
 * Maps control ref prefixes (as used in ADAPTER_EVIDENCE_REGISTRY) to
 * the canonical framework names used in the compliance_evidence table
 * and the CDT rules engine.
 *
 * Multi-segment prefixes (ISO-27001, NIST-CSF) are matched longest-first
 * so a naïve indexOf("-") split doesn't mangle them.
 */
const FRAMEWORK_PREFIX_MAP: [string, string][] = [
  ["ISO-27001", "ISO27001"],
  ["NIST-CSF", "NIST_CSF"],
  ["SOC2", "SOC2"],
  ["HIPAA", "HIPAA"],
  ["GDPR", "GDPR"],
];

export function parseControlRef(ref: string): {
  framework: string;
  controlId: string;
} {
  for (const [prefix, framework] of FRAMEWORK_PREFIX_MAP) {
    if (ref.startsWith(prefix + "-")) {
      return { framework, controlId: ref.slice(prefix.length + 1) };
    }
  }
  return { framework: ref, controlId: ref };
}
