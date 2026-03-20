/**
 * CDT (Compliance Decision Tree) Rules Engine
 *
 * Evaluates all SOC2 CC6.x, CC7.x and ISO27001 A.9.x controls against
 * collected evidence in the compliance_evidence table.
 *
 * For each control, the evaluator:
 *   1. Queries compliance_evidence for matching (tenant_id, control_id) rows
 *   2. Derives a status based on evidence recency and count:
 *        - no evidence         → not_started
 *        - only old evidence   → in_progress  (>30 days since last)
 *        - recent evidence     → implemented  (within 30 days)
 *        - manual verification → verified     (requires explicit audit)
 *
 * Used by the compliance-worker scoring endpoint to produce per-control
 * statuses that feed into the weighted framework score.
 */

// ── Control definitions ─────────────────────────────────────────────────────

export interface ControlDefinition {
  controlId: string;
  controlName: string;
  framework: "SOC2" | "ISO27001" | "NIST_CSF" | "HIPAA" | "GDPR";
  description: string;
  /** Evidence sources that can satisfy this control */
  evidenceSources: string[];
}

export type ControlStatus = "not_started" | "in_progress" | "implemented" | "verified";

export interface ControlEvaluation {
  controlId: string;
  controlName: string;
  framework: string;
  status: ControlStatus;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  description: string;
}

// ── SOC2 CC6.x — Logical and Physical Access Controls ───────────────────────

const SOC2_CC6: ControlDefinition[] = [
  {
    controlId: "CC6.1",
    controlName: "Logical access security — provisioning, RBAC, and removal",
    framework: "SOC2",
    description:
      "The entity implements logical access security over protected information assets using provisioning, role-based access, and removal procedures.",
    evidenceSources: ["access_grant", "access_revoke", "audit_log"],
  },
  {
    controlId: "CC6.2",
    controlName: "MFA and credential management",
    framework: "SOC2",
    description:
      "Prior to issuing system credentials, the entity registers and authorizes new users and validates that MFA is enforced.",
    evidenceSources: ["access_grant"],
  },
  {
    controlId: "CC6.3",
    controlName: "Access removal on termination or role change",
    framework: "SOC2",
    description:
      "The entity authorizes, modifies, or removes access to data based on role changes, terminations, or transfers.",
    evidenceSources: ["access_revoke", "offboarding"],
  },
  {
    controlId: "CC6.4",
    controlName: "Physical access restrictions",
    framework: "SOC2",
    description:
      "The entity restricts physical access to facilities and protected information assets.",
    evidenceSources: [], // manual — no automated evidence
  },
  {
    controlId: "CC6.5",
    controlName: "Asset disposal and data destruction",
    framework: "SOC2",
    description:
      "The entity discontinues logical and physical protections over assets only after data is securely destroyed.",
    evidenceSources: [], // manual
  },
  {
    controlId: "CC6.6",
    controlName: "Protection against threats outside system boundaries",
    framework: "SOC2",
    description:
      "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
    evidenceSources: ["incident"],
  },
  {
    controlId: "CC6.7",
    controlName: "Transmission integrity and security",
    framework: "SOC2",
    description:
      "The entity restricts the transmission, movement, and removal of information to authorized users and processes. Includes branch protection for code.",
    evidenceSources: ["automated"], // GitHub branch protection evidence
  },
  {
    controlId: "CC6.8",
    controlName: "Unauthorized or malicious software prevention",
    framework: "SOC2",
    description:
      "The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.",
    evidenceSources: ["automated"], // MFA enforcement, security scanning
  },
];

// ── SOC2 CC7.x — System Operations ──────────────────────────────────────────

const SOC2_CC7: ControlDefinition[] = [
  {
    controlId: "CC7.1",
    controlName: "Detection of configuration changes and vulnerabilities",
    framework: "SOC2",
    description:
      "The entity uses detection mechanisms to identify changes to configurations and new vulnerabilities that could impact the system.",
    evidenceSources: ["audit_log", "automated"],
  },
  {
    controlId: "CC7.2",
    controlName: "Anomalous activity monitoring",
    framework: "SOC2",
    description:
      "The entity monitors system components and the operation of those components for anomalies indicative of security events.",
    evidenceSources: ["incident", "audit_log"],
  },
  {
    controlId: "CC7.3",
    controlName: "Security incident evaluation and response",
    framework: "SOC2",
    description:
      "The entity evaluates security events to determine whether they constitute security incidents requiring response.",
    evidenceSources: ["incident"],
  },
  {
    controlId: "CC7.4",
    controlName: "Incident response execution",
    framework: "SOC2",
    description:
      "The entity responds to identified security incidents by executing a defined incident response program.",
    evidenceSources: ["incident"],
  },
  {
    controlId: "CC7.5",
    controlName: "Incident recovery and lessons learned",
    framework: "SOC2",
    description:
      "The entity identifies, develops, and implements activities to recover from identified security incidents.",
    evidenceSources: ["incident", "policy_change"],
  },
];

// ── ISO 27001 A.9.x — Access Control ────────────────────────────────────────

const ISO27001_A9: ControlDefinition[] = [
  {
    controlId: "A.9.1.1",
    controlName: "Access control policy",
    framework: "ISO27001",
    description:
      "An access control policy is established, documented, and reviewed based on business and information security requirements.",
    evidenceSources: ["policy_change", "audit_log"],
  },
  {
    controlId: "A.9.1.2",
    controlName: "Access to networks and network services",
    framework: "ISO27001",
    description:
      "Users are provided access to the network and network services that they have been specifically authorized to use.",
    evidenceSources: ["access_grant", "audit_log"],
  },
  {
    controlId: "A.9.2.1",
    controlName: "User registration and de-registration",
    framework: "ISO27001",
    description:
      "A formal user registration and de-registration process is implemented to enable assignment of access rights.",
    evidenceSources: ["access_grant", "access_revoke", "audit_log"],
  },
  {
    controlId: "A.9.2.2",
    controlName: "User access provisioning",
    framework: "ISO27001",
    description:
      "A formal user access provisioning process is implemented to assign or revoke access rights for all users.",
    evidenceSources: ["access_grant"],
  },
  {
    controlId: "A.9.2.3",
    controlName: "Management of privileged access rights",
    framework: "ISO27001",
    description: "The allocation and use of privileged access rights is restricted and controlled.",
    evidenceSources: ["access_grant", "access_revoke"],
  },
  {
    controlId: "A.9.2.4",
    controlName: "Management of secret authentication information",
    framework: "ISO27001",
    description:
      "The allocation of secret authentication information is controlled through a formal management process.",
    evidenceSources: [], // manual — credential rotation audits
  },
  {
    controlId: "A.9.2.5",
    controlName: "Review of user access rights",
    framework: "ISO27001",
    description: "Asset owners review user access rights at regular intervals.",
    evidenceSources: ["audit_log", "access_revoke"], // access reviews feed this
  },
  {
    controlId: "A.9.2.6",
    controlName: "Removal or adjustment of access rights",
    framework: "ISO27001",
    description:
      "The access rights of all employees and external party users to information and information processing facilities are removed upon termination or adjusted upon change.",
    evidenceSources: ["access_revoke", "offboarding"],
  },
  {
    controlId: "A.9.3.1",
    controlName: "Use of secret authentication information",
    framework: "ISO27001",
    description:
      "Users are required to follow the organization's practices in the use of secret authentication information (password policy).",
    evidenceSources: [], // manual
  },
  {
    controlId: "A.9.4.1",
    controlName: "Information access restriction",
    framework: "ISO27001",
    description:
      "Access to information and application system functions is restricted in accordance with the access control policy.",
    evidenceSources: ["access_grant", "access_revoke"],
  },
  {
    controlId: "A.9.4.2",
    controlName: "Secure log-on procedures (MFA)",
    framework: "ISO27001",
    description:
      "Where required by the access control policy, access to systems and applications is controlled by a secure log-on procedure including MFA.",
    evidenceSources: ["automated"], // Google Workspace MFA evidence
  },
  {
    controlId: "A.9.4.3",
    controlName: "Password management system",
    framework: "ISO27001",
    description: "Password management systems are interactive and ensure quality passwords.",
    evidenceSources: [], // manual
  },
  {
    controlId: "A.9.4.4",
    controlName: "Use of privileged utility programs",
    framework: "ISO27001",
    description:
      "The use of utility programs that might be capable of overriding system and application controls is restricted and tightly controlled.",
    evidenceSources: ["audit_log"],
  },
  {
    controlId: "A.9.4.5",
    controlName: "Access control to program source code",
    framework: "ISO27001",
    description: "Access to program source code is restricted.",
    evidenceSources: ["automated"], // GitHub branch protection / repo access
  },
];

// ── NIST CSF — Protect / Respond ─────────────────────────────────────────────

const NIST_CSF: ControlDefinition[] = [
  {
    controlId: "PR.AC-1",
    controlName: "Identity management and access control",
    framework: "NIST_CSF",
    description:
      "Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users, and processes.",
    evidenceSources: ["onboarding", "access_grant", "directory_sync"],
  },
  {
    controlId: "PR.AC-4",
    controlName: "Least privilege and separation of duties",
    framework: "NIST_CSF",
    description:
      "Access permissions and authorizations are managed, incorporating the principles of least privilege and separation of duties.",
    evidenceSources: ["access_grant", "access_revoke", "role_change"],
  },
  {
    controlId: "RS.CO-2",
    controlName: "Incidents are reported consistent with criteria",
    framework: "NIST_CSF",
    description: "Incidents are reported consistent with established criteria.",
    evidenceSources: ["incident"],
  },
];

// ── HIPAA — Access Control ──────────────────────────────────────────────────

const HIPAA_CONTROLS: ControlDefinition[] = [
  {
    controlId: "164.312(a)(1)",
    controlName: "Access control — ePHI",
    framework: "HIPAA",
    description:
      "Implement technical policies and procedures for systems that maintain ePHI to allow access only to authorized persons or software programs.",
    evidenceSources: ["access_grant", "access_revoke", "access_review"],
  },
];

// ── GDPR — Integrity, Confidentiality, Erasure ─────────────────────────────

const GDPR_CONTROLS: ControlDefinition[] = [
  {
    controlId: "Art.5(1)(f)",
    controlName: "Integrity and confidentiality",
    framework: "GDPR",
    description:
      "Personal data shall be processed in a manner that ensures appropriate security, including protection against unauthorized or unlawful processing and against accidental loss, destruction, or damage.",
    evidenceSources: ["offboarding", "access_revoke"],
  },
  {
    controlId: "Art.17",
    controlName: "Right to erasure",
    framework: "GDPR",
    description:
      "The data subject shall have the right to obtain from the controller the erasure of personal data concerning them without undue delay.",
    evidenceSources: ["offboarding"],
  },
];

// ── All controls ────────────────────────────────────────────────────────────

export const ALL_CONTROLS: ControlDefinition[] = [
  ...SOC2_CC6,
  ...SOC2_CC7,
  ...ISO27001_A9,
  ...NIST_CSF,
  ...HIPAA_CONTROLS,
  ...GDPR_CONTROLS,
];

export function getControlsByFramework(framework: string): ControlDefinition[] {
  return ALL_CONTROLS.filter((c) => c.framework === framework);
}

// ── Evaluation engine ───────────────────────────────────────────────────────

const RECENT_THRESHOLD_DAYS = 30;

interface EvidenceRow {
  control_id: string;
  cnt: number;
  last_at: string | null;
}

interface VerifiedRow {
  control_id: string;
  verified_at: string;
}

/**
 * Evaluate all controls for a tenant against collected evidence.
 *
 * Returns a ControlEvaluation for every defined control.
 * Controls with no possible automated evidence sources get `not_started`
 * unless there's explicit evidence in the DB (from manual uploads).
 */
export async function evaluateControls(
  db: D1Database,
  tenantId: string,
  framework?: string,
): Promise<ControlEvaluation[]> {
  const controls = framework ? getControlsByFramework(framework) : ALL_CONTROLS;

  if (controls.length === 0) return [];

  // Batch-fetch evidence counts and last dates for all control IDs in scope
  const controlIds = controls.map((c) => c.controlId);
  const placeholders = controlIds.map(() => "?").join(",");

  // Fetch evidence stats and verification attestations in parallel
  const [evidenceResult, verifiedResult] = await Promise.all([
    db
      .prepare(
        `SELECT control_id,
                COUNT(*) AS cnt,
                MAX(created_at) AS last_at
         FROM compliance_evidence
         WHERE tenant_id = ? AND control_id IN (${placeholders})
         GROUP BY control_id`,
      )
      .bind(tenantId, ...controlIds)
      .all<EvidenceRow>(),
    // Verification attestations — explicit manual sign-off stored as evidence
    // with evidence_type = 'verification_attestation'
    db
      .prepare(
        `SELECT control_id, MAX(created_at) AS verified_at
         FROM compliance_evidence
         WHERE tenant_id = ? AND control_id IN (${placeholders})
           AND evidence_type = 'verification_attestation'
         GROUP BY control_id`,
      )
      .bind(tenantId, ...controlIds)
      .all<VerifiedRow>(),
  ]);

  // Index evidence by control_id for O(1) lookup
  const evidenceMap = new Map<string, EvidenceRow>();
  for (const row of evidenceResult.results ?? []) {
    evidenceMap.set(row.control_id, row);
  }

  // Index verified attestations
  const verifiedMap = new Map<string, string>();
  for (const row of verifiedResult.results ?? []) {
    verifiedMap.set(row.control_id, row.verified_at);
  }

  const now = Date.now();
  const thresholdMs = RECENT_THRESHOLD_DAYS * 86_400_000;

  return controls.map((control) => {
    const ev = evidenceMap.get(control.controlId);
    const count = ev?.cnt ?? 0;
    const lastAt = ev?.last_at ?? null;

    let status: ControlStatus = "not_started";

    if (count > 0 && lastAt) {
      const ageMs = now - new Date(lastAt).getTime();
      if (ageMs <= thresholdMs) {
        status = "implemented";
      } else {
        status = "in_progress";
      }
    } else if (control.evidenceSources.length === 0) {
      status = "not_started";
    }

    // Promote to verified if there's a recent verification attestation
    const verifiedAt = verifiedMap.get(control.controlId);
    if (verifiedAt && status === "implemented") {
      const verifiedAgeMs = now - new Date(verifiedAt).getTime();
      if (verifiedAgeMs <= thresholdMs) {
        status = "verified";
      }
    }

    return {
      controlId: control.controlId,
      controlName: control.controlName,
      framework: control.framework,
      status,
      evidenceCount: count,
      lastEvidenceAt: lastAt,
      description: control.description,
    };
  });
}

/**
 * Compute a framework score from control evaluations.
 * Uses the same weighting as console-app scoring:
 *   not_started=0, in_progress=0.25, implemented=0.75, verified=1.0
 */
const STATUS_WEIGHTS: Record<ControlStatus, number> = {
  not_started: 0,
  in_progress: 0.25,
  implemented: 0.75,
  verified: 1.0,
};

export interface FrameworkScore {
  framework: string;
  score: number;
  grade: string;
  controlsTotal: number;
  controlsNotStarted: number;
  controlsInProgress: number;
  controlsImplemented: number;
  controlsVerified: number;
}

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function scoreFromEvaluations(evaluations: ControlEvaluation[]): FrameworkScore[] {
  const byFramework = new Map<string, ControlEvaluation[]>();
  for (const ev of evaluations) {
    if (!byFramework.has(ev.framework)) byFramework.set(ev.framework, []);
    byFramework.get(ev.framework)!.push(ev);
  }

  const scores: FrameworkScore[] = [];
  for (const [framework, controls] of byFramework) {
    const total = controls.length;
    const weightSum = controls.reduce(
      (sum, c) => sum + (STATUS_WEIGHTS[c.status as ControlStatus] ?? 0),
      0,
    );
    const score = total > 0 ? Math.round((weightSum / total) * 100 * 100) / 100 : 0;

    scores.push({
      framework,
      score,
      grade: computeGrade(score),
      controlsTotal: total,
      controlsNotStarted: controls.filter((c) => c.status === "not_started").length,
      controlsInProgress: controls.filter((c) => c.status === "in_progress").length,
      controlsImplemented: controls.filter((c) => c.status === "implemented").length,
      controlsVerified: controls.filter((c) => c.status === "verified").length,
    });
  }

  return scores;
}
