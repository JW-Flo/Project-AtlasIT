/**
 * Evidence Classification Engine
 *
 * Treats ALL tenant data mutations as potential compliance evidence.
 * Every event flowing through the system is classified against compliance
 * controls and tagged with impact direction (positive/detrimental/neutral).
 *
 * This is the core of "lifecycle management IS compliance" — the classifier
 * sits at the boundary of every tenant data mutation and determines:
 *   1. Which compliance controls are affected
 *   2. Whether the impact is positive (strengthens compliance) or detrimental
 *   3. Evidence type for categorization in the locker
 *   4. A confidence score for the classification
 *
 * Tenant-scoped: only classifies data belonging to a specific tenant.
 * Internal platform data (infra, deployment, agent registry) is excluded.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvidenceImpact = "positive" | "detrimental" | "neutral";

export type EvidenceCategory =
  | "access_grant"
  | "access_revoke"
  | "offboarding"
  | "onboarding"
  | "role_change"
  | "directory_sync"
  | "mfa_enforcement"
  | "incident_response"
  | "policy_change"
  | "config_change"
  | "access_review"
  | "compliance_check"
  | "workflow_execution"
  | "nhi_lifecycle"
  | "shadow_discovery"
  | "audit_log";

export interface ControlClassification {
  framework: string;
  controlId: string;
  controlName: string;
  impact: EvidenceImpact;
  confidence: number; // 0.0 – 1.0
  category: EvidenceCategory;
  reasoning: string; // human-readable explanation for audit trail
}

export interface ClassifiedEvidence {
  /** Tenant this evidence belongs to */
  tenantId: string;
  /** Original event type that triggered classification */
  eventType: string;
  /** Source system (adapter name, orchestrator, console, etc.) */
  source: string;
  /** The actor who caused this (user email or "system") */
  actor: string;
  /** The subject affected (user email, app name, resource) */
  subject: string | null;
  /** All controls this event maps to, with impact */
  controls: ControlClassification[];
  /** Raw payload snapshot for the evidence locker */
  payload: Record<string, unknown>;
  /** ISO timestamp */
  classifiedAt: string;
  /** SHA-256 content hash for tamper evidence */
  contentHash?: string;
}

// ── Event → Control Mapping Rules ─────────────────────────────────────────────

interface ClassificationRule {
  /** Event type pattern — exact match or prefix with wildcard */
  eventPattern: string;
  /** Controls affected by this event type */
  controls: Array<{
    framework: string;
    controlId: string;
    controlName: string;
    impact: EvidenceImpact;
    confidence: number;
    category: EvidenceCategory;
    reasoning: string;
  }>;
  /** Optional: derive impact dynamically from payload */
  deriveImpact?: (payload: Record<string, unknown>) => EvidenceImpact;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // ── User Lifecycle: Joins ───────────────────────────────────────────────
  {
    eventPattern: "user.created",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "onboarding",
        reasoning: "New user registered through formal provisioning process",
      },
      {
        framework: "SOC2",
        controlId: "CC6.2",
        controlName: "Credential management",
        impact: "positive",
        confidence: 0.85,
        category: "onboarding",
        reasoning: "User credentials issued through controlled process",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "User registration",
        impact: "positive",
        confidence: 0.95,
        category: "onboarding",
        reasoning: "Formal user registration process executed",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.2",
        controlName: "User access provisioning",
        impact: "positive",
        confidence: 0.9,
        category: "onboarding",
        reasoning: "Access provisioned through formal process",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "Identity management",
        impact: "positive",
        confidence: 0.9,
        category: "onboarding",
        reasoning: "Identity created and managed",
      },
    ],
  },
  {
    eventPattern: "user.provisioned",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "access_grant",
        reasoning: "App access provisioned through automated workflow",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.2",
        controlName: "User access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "access_grant",
        reasoning: "Formal access provisioning executed",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(a)(1)",
        controlName: "Access control",
        impact: "positive",
        confidence: 0.85,
        category: "access_grant",
        reasoning: "Access granted through controlled mechanism",
      },
    ],
  },

  // ── User Lifecycle: Leaves ──────────────────────────────────────────────
  {
    eventPattern: "user.deactivated",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access removal on termination",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "User deactivated — access removal initiated",
      },
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access removal",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "Access rights being revoked through formal process",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Removal of access rights",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "Access rights removed upon termination",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "User de-registration",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "User de-registration process executed",
      },
      {
        framework: "GDPR",
        controlId: "Art.5(1)(f)",
        controlName: "Integrity and confidentiality",
        impact: "positive",
        confidence: 0.85,
        category: "offboarding",
        reasoning: "Data access terminated for departed user",
      },
    ],
  },
  {
    eventPattern: "user.suspended",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access removal on suspension",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "User suspended — access temporarily removed",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Adjustment of access rights",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "Access adjusted due to suspension",
      },
    ],
  },
  {
    eventPattern: "user.deleted",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access removal — permanent",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "User permanently removed from system",
      },
      {
        framework: "SOC2",
        controlId: "CC6.5",
        controlName: "Asset disposal",
        impact: "positive",
        confidence: 0.8,
        category: "offboarding",
        reasoning: "User account and associated data disposed",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Removal of access rights",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "All access rights permanently removed",
      },
      {
        framework: "GDPR",
        controlId: "Art.17",
        controlName: "Right to erasure",
        impact: "positive",
        confidence: 0.75,
        category: "offboarding",
        reasoning: "User data deletion supports erasure rights",
      },
    ],
  },

  // ── User Lifecycle: Moves ───────────────────────────────────────────────
  {
    eventPattern: "user.reactivated",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access re-provisioning",
        impact: "positive",
        confidence: 0.85,
        category: "access_grant",
        reasoning: "User reactivated through formal process",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.2",
        controlName: "User access provisioning",
        impact: "positive",
        confidence: 0.85,
        category: "access_grant",
        reasoning: "Access re-provisioned after reactivation",
      },
    ],
  },
  {
    eventPattern: "user.profile_updated",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Access rights review on change",
        impact: "neutral",
        confidence: 0.7,
        category: "role_change",
        reasoning: "Profile updated — access rights should be reviewed",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.5",
        controlName: "Review of user access rights",
        impact: "neutral",
        confidence: 0.7,
        category: "role_change",
        reasoning: "Profile change may require access review",
      },
    ],
  },
  {
    eventPattern: "group.membership_changed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Role-based access change",
        impact: "neutral",
        confidence: 0.8,
        category: "role_change",
        reasoning: "Group membership changed — RBAC entitlements may shift",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "Privileged access management",
        impact: "neutral",
        confidence: 0.75,
        category: "role_change",
        reasoning: "Group change may affect privileged access",
      },
    ],
  },

  // ── JML: Directory-scoped user lifecycle events ─────────────────────────
  // These are the canonical event types emitted when a directory sync
  // produces a join/move/leave action (as opposed to raw adapter user.* events).
  {
    eventPattern: "directory.user.joined",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "onboarding",
        reasoning: "New joiner detected via directory sync — access provisioning initiated",
      },
      {
        framework: "SOC2",
        controlId: "CC6.2",
        controlName: "Credential management",
        impact: "positive",
        confidence: 0.85,
        category: "onboarding",
        reasoning: "User credentials issued through controlled provisioning process",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "User registration",
        impact: "positive",
        confidence: 0.95,
        category: "onboarding",
        reasoning: "User formally registered via directory joiner workflow",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.2",
        controlName: "User access provisioning",
        impact: "positive",
        confidence: 0.9,
        category: "onboarding",
        reasoning: "Access provisioned through formal JML joiner process",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "Identity management",
        impact: "positive",
        confidence: 0.9,
        category: "onboarding",
        reasoning: "Identity lifecycle managed via automated joiner workflow",
      },
    ],
  },
  {
    eventPattern: "directory.user.moved",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Access rights review on role change",
        impact: "positive",
        confidence: 0.9,
        category: "role_change",
        reasoning: "Mover detected — old access revoked and new access provisioned per role change",
      },
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access modification on transfer",
        impact: "positive",
        confidence: 0.9,
        category: "role_change",
        reasoning: "Access entitlements updated to reflect new department or role",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.5",
        controlName: "Review of user access rights",
        impact: "positive",
        confidence: 0.9,
        category: "role_change",
        reasoning: "User move triggered formal access rights review and update",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Adjustment of access rights",
        impact: "positive",
        confidence: 0.85,
        category: "role_change",
        reasoning: "Stale access rights adjusted to reflect new organisational position",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-4",
        controlName: "Least privilege",
        impact: "positive",
        confidence: 0.85,
        category: "role_change",
        reasoning: "Least-privilege enforced — excess entitlements revoked on move",
      },
    ],
  },
  {
    eventPattern: "directory.user.left",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access removal on termination",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "Leaver detected via directory sync — access revocation initiated",
      },
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access removal",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "All logical access rights revoked through formal leaver process",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Removal of access rights",
        impact: "positive",
        confidence: 0.95,
        category: "offboarding",
        reasoning: "Access rights removed following user departure from directory",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "User de-registration",
        impact: "positive",
        confidence: 0.9,
        category: "offboarding",
        reasoning: "User de-registered from directory via formal leaver workflow",
      },
      {
        framework: "GDPR",
        controlId: "Art.5(1)(f)",
        controlName: "Integrity and confidentiality",
        impact: "positive",
        confidence: 0.85,
        category: "offboarding",
        reasoning: "Data access terminated for departed user — confidentiality maintained",
      },
    ],
  },

  // ── Directory Sync ──────────────────────────────────────────────────────
  {
    eventPattern: "directory.synced",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Directory audit",
        impact: "positive",
        confidence: 0.85,
        category: "directory_sync",
        reasoning: "Directory synchronized — user roster validated",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "User registration audit",
        impact: "positive",
        confidence: 0.85,
        category: "directory_sync",
        reasoning: "Directory sync validates active user registry",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.5",
        controlName: "Review of user access rights",
        impact: "positive",
        confidence: 0.8,
        category: "directory_sync",
        reasoning: "Sync provides periodic access rights review",
      },
    ],
  },

  // ── Access Grants / Revokes (from automation) ───────────────────────────
  {
    eventPattern: "access.granted",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "access_grant",
        reasoning: "Access granted through automated control",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.2",
        controlName: "User access provisioning",
        impact: "positive",
        confidence: 0.95,
        category: "access_grant",
        reasoning: "Formal provisioning process executed",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-4",
        controlName: "Least privilege",
        impact: "positive",
        confidence: 0.8,
        category: "access_grant",
        reasoning: "Access provisioned per defined policy",
      },
    ],
  },
  {
    eventPattern: "access.revoked",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Logical access removal",
        impact: "positive",
        confidence: 0.95,
        category: "access_revoke",
        reasoning: "Access revoked through automated control",
      },
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "Access removal",
        impact: "positive",
        confidence: 0.9,
        category: "access_revoke",
        reasoning: "Access removed as part of lifecycle management",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Removal of access rights",
        impact: "positive",
        confidence: 0.95,
        category: "access_revoke",
        reasoning: "Formal access removal executed",
      },
    ],
  },

  // ── Compliance Evidence Collection ──────────────────────────────────────
  {
    eventPattern: "compliance.evidence.collected",
    controls: [], // dynamically mapped from payload.controlId
  },

  // ── MFA Events ──────────────────────────────────────────────────────────
  {
    eventPattern: "mfa.enforced",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.2",
        controlName: "MFA enforcement",
        impact: "positive",
        confidence: 0.95,
        category: "mfa_enforcement",
        reasoning: "Multi-factor authentication enforced",
      },
      {
        framework: "SOC2",
        controlId: "CC6.8",
        controlName: "Malicious software prevention",
        impact: "positive",
        confidence: 0.8,
        category: "mfa_enforcement",
        reasoning: "MFA reduces unauthorized access risk",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.4.2",
        controlName: "Secure log-on procedures",
        impact: "positive",
        confidence: 0.95,
        category: "mfa_enforcement",
        reasoning: "MFA implements secure log-on",
      },
    ],
  },
  {
    eventPattern: "mfa.disabled",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.2",
        controlName: "MFA enforcement",
        impact: "detrimental",
        confidence: 0.95,
        category: "mfa_enforcement",
        reasoning: "MFA disabled — weakens credential security",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.4.2",
        controlName: "Secure log-on procedures",
        impact: "detrimental",
        confidence: 0.95,
        category: "mfa_enforcement",
        reasoning: "Secure log-on weakened by MFA removal",
      },
    ],
  },

  // ── Incidents ───────────────────────────────────────────────────────────
  {
    eventPattern: "incident.created",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC7.3",
        controlName: "Incident evaluation",
        impact: "positive",
        confidence: 0.9,
        category: "incident_response",
        reasoning: "Security event identified and recorded",
      },
      {
        framework: "SOC2",
        controlId: "CC7.4",
        controlName: "Incident response execution",
        impact: "positive",
        confidence: 0.85,
        category: "incident_response",
        reasoning: "Incident response process initiated",
      },
      {
        framework: "ISO27001",
        controlId: "A.16.1.2",
        controlName: "Reporting security events",
        impact: "positive",
        confidence: 0.9,
        category: "incident_response",
        reasoning: "Security event formally reported",
      },
      {
        framework: "NIST_CSF",
        controlId: "RS.CO-2",
        controlName: "Incidents reported",
        impact: "positive",
        confidence: 0.9,
        category: "incident_response",
        reasoning: "Incident reported to stakeholders",
      },
    ],
  },
  {
    eventPattern: "incident.resolved",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC7.5",
        controlName: "Incident recovery",
        impact: "positive",
        confidence: 0.9,
        category: "incident_response",
        reasoning: "Incident resolved — recovery procedures executed",
      },
      {
        framework: "ISO27001",
        controlId: "A.16.1.6",
        controlName: "Learning from incidents",
        impact: "positive",
        confidence: 0.85,
        category: "incident_response",
        reasoning: "Incident resolution supports lessons learned",
      },
    ],
  },

  {
    eventPattern: "policy.approved",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC1.1",
        controlName: "Control environment — policy governance",
        impact: "positive",
        confidence: 0.95,
        category: "policy_change",
        reasoning: "Security policy formally reviewed and approved",
      },
      {
        framework: "ISO27001",
        controlId: "A.5.1",
        controlName: "Information security policies",
        impact: "positive",
        confidence: 0.95,
        category: "policy_change",
        reasoning: "Policy approved through formal review workflow",
      },
    ],
  },

  {
    eventPattern: "incident_sla_breached",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC7.4",
        controlName: "Incident response timeliness",
        impact: "detrimental",
        confidence: 0.95,
        category: "incident_response",
        reasoning: "Incident SLA deadline breached — response timeliness failure",
      },
      {
        framework: "ISO27001",
        controlId: "A.16.1.4",
        controlName: "Assessment and decision on events",
        impact: "detrimental",
        confidence: 0.9,
        category: "incident_response",
        reasoning: "Incident not assessed within SLA timeframe",
      },
    ],
  },

  // ── Access Reviews ──────────────────────────────────────────────────────
  {
    eventPattern: "access_review.completed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Access review — periodic",
        impact: "positive",
        confidence: 0.95,
        category: "access_review",
        reasoning: "Periodic access review completed",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.5",
        controlName: "Review of user access rights",
        impact: "positive",
        confidence: 0.95,
        category: "access_review",
        reasoning: "Formal access rights review executed",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(a)(1)",
        controlName: "Access control review",
        impact: "positive",
        confidence: 0.85,
        category: "access_review",
        reasoning: "Access controls reviewed per policy",
      },
    ],
  },
  {
    eventPattern: "access_review.expired",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Access review — overdue",
        impact: "detrimental",
        confidence: 0.9,
        category: "access_review",
        reasoning: "Access review expired without completion — gap in periodic review",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.5",
        controlName: "Review of user access rights",
        impact: "detrimental",
        confidence: 0.9,
        category: "access_review",
        reasoning: "Access review deadline missed",
      },
    ],
  },

  // ── Automation Execution ────────────────────────────────────────────────
  {
    eventPattern: "automation.executed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC8.1",
        controlName: "Authorized change execution",
        impact: "positive",
        confidence: 0.8,
        category: "workflow_execution",
        reasoning: "Automation rule executed per defined policy",
      },
      {
        framework: "ISO27001",
        controlId: "A.12.1.2",
        controlName: "Change management",
        impact: "positive",
        confidence: 0.8,
        category: "workflow_execution",
        reasoning: "Change executed through controlled automation",
      },
    ],
  },
  {
    eventPattern: "automation.failed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC8.1",
        controlName: "Change execution failure",
        impact: "detrimental",
        confidence: 0.75,
        category: "workflow_execution",
        reasoning: "Automation failed — intended change not applied",
      },
    ],
  },

  // ── Policy / Config Changes ─────────────────────────────────────────────
  {
    eventPattern: "policy.updated",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC4.1",
        controlName: "Monitoring of controls",
        impact: "positive",
        confidence: 0.85,
        category: "policy_change",
        reasoning: "Security policy updated",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.1.1",
        controlName: "Access control policy",
        impact: "positive",
        confidence: 0.85,
        category: "policy_change",
        reasoning: "Access control policy reviewed and updated",
      },
    ],
  },
  {
    eventPattern: "config.changed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC7.1",
        controlName: "Configuration change detection",
        impact: "neutral",
        confidence: 0.7,
        category: "config_change",
        reasoning: "Configuration change detected — review for security impact",
      },
      {
        framework: "ISO27001",
        controlId: "A.12.1.2",
        controlName: "Change management",
        impact: "neutral",
        confidence: 0.7,
        category: "config_change",
        reasoning: "Configuration change recorded for audit",
      },
    ],
  },

  // ── App Connection / Disconnection ──────────────────────────────────────
  {
    eventPattern: "app_connected",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "System boundary protection",
        impact: "neutral",
        confidence: 0.75,
        category: "config_change",
        reasoning: "New system boundary established via app connection",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.1.2",
        controlName: "Network service access",
        impact: "neutral",
        confidence: 0.75,
        category: "config_change",
        reasoning: "New network service access authorized",
      },
    ],
  },
  {
    eventPattern: "app_disconnected",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "System boundary change",
        impact: "neutral",
        confidence: 0.75,
        category: "config_change",
        reasoning: "System boundary removed — app disconnected",
      },
    ],
  },

  // ── Non-Human Identity (NHI) Lifecycle ─────────────────────────────────
  {
    eventPattern: "nhi.credential.discovered",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI inventory discovery",
        impact: "positive",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Non-human identity discovered and inventoried",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.1",
        controlName: "NHI registration",
        impact: "positive",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Service account/API key registered in directory",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "NHI identity management",
        impact: "positive",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Non-human identity tracked in identity management system",
      },
    ],
  },
  {
    eventPattern: "nhi.credential.rotated",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI credential rotation",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Non-human credential rotated per security policy",
      },
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "System credential management",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "System credential rotated to reduce exposure risk",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "Secret authentication info management",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Secret authentication information refreshed",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "Credential lifecycle management",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Credential rotated as part of lifecycle management",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(d)",
        controlName: "Entity authentication",
        impact: "positive",
        confidence: 0.85,
        category: "nhi_lifecycle",
        reasoning: "Entity authentication credential refreshed",
      },
    ],
  },
  {
    eventPattern: "nhi.token.expiring",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI expiry monitoring",
        impact: "neutral",
        confidence: 0.85,
        category: "nhi_lifecycle",
        reasoning: "Non-human token approaching expiry — rotation recommended",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "Secret authentication info review",
        impact: "neutral",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Credential expiry detected — review needed",
      },
    ],
  },
  {
    eventPattern: "nhi.token.expired",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI expired credential",
        impact: "detrimental",
        confidence: 0.95,
        category: "nhi_lifecycle",
        reasoning:
          "Non-human token expired without rotation — potential service disruption and security risk",
      },
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "System credential lapse",
        impact: "detrimental",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "System credential expired — boundary protection weakened",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "Secret authentication info lapse",
        impact: "detrimental",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Secret authentication information expired without renewal",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "Credential management gap",
        impact: "detrimental",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Credential lifecycle management gap — expired token not rotated",
      },
    ],
  },
  {
    eventPattern: "nhi.credential.revoked",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI credential revocation",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Non-human credential revoked — access removed",
      },
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "NHI offboarding",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "NHI access removed as part of offboarding",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "Removal of NHI access rights",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Non-human access rights formally removed",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(d)",
        controlName: "Entity authentication removal",
        impact: "positive",
        confidence: 0.85,
        category: "nhi_lifecycle",
        reasoning: "Entity authentication credential revoked",
      },
      {
        framework: "GDPR",
        controlId: "Art.5(1)(f)",
        controlName: "Integrity and confidentiality",
        impact: "positive",
        confidence: 0.85,
        category: "nhi_lifecycle",
        reasoning: "NHI access revoked — data confidentiality maintained",
      },
    ],
  },
  {
    eventPattern: "nhi.owner.assigned",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "NHI ownership assignment",
        impact: "positive",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Human owner assigned to non-human identity for accountability",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "NHI accountability",
        impact: "positive",
        confidence: 0.8,
        category: "nhi_lifecycle",
        reasoning: "Accountability established for secret authentication information",
      },
    ],
  },
  {
    eventPattern: "nhi.offboarding.completed",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.3",
        controlName: "NHI offboarding complete",
        impact: "positive",
        confidence: 0.95,
        category: "nhi_lifecycle",
        reasoning: "All NHI credentials owned by departed user revoked or reassigned",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.6",
        controlName: "NHI access rights removal",
        impact: "positive",
        confidence: 0.95,
        category: "nhi_lifecycle",
        reasoning: "NHI access rights removed as part of user offboarding",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.AC-1",
        controlName: "NHI lifecycle closure",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Non-human identity lifecycle properly closed during offboarding",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(d)",
        controlName: "Entity authentication cleanup",
        impact: "positive",
        confidence: 0.9,
        category: "nhi_lifecycle",
        reasoning: "Entity authentication credentials cleaned up during offboarding",
      },
    ],
  },

  // ── Shadow AI & SaaS Discovery ─────────────────────────────────────────
  {
    eventPattern: "discovery.app.found",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "Unapproved app detected",
        impact: "detrimental",
        confidence: 0.8,
        category: "shadow_discovery",
        reasoning: "Unapproved application discovered via OAuth grant analysis",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.1.2",
        controlName: "Unauthorized network service access",
        impact: "detrimental",
        confidence: 0.8,
        category: "shadow_discovery",
        reasoning: "Unauthorized service access detected — not in approved catalog",
      },
    ],
  },
  {
    eventPattern: "discovery.ai_tool.found",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "Unapproved AI tool detected",
        impact: "detrimental",
        confidence: 0.9,
        category: "shadow_discovery",
        reasoning: "Unapproved AI/LLM tool detected — potential data exfiltration risk",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.1.2",
        controlName: "Unauthorized AI service access",
        impact: "detrimental",
        confidence: 0.9,
        category: "shadow_discovery",
        reasoning: "Unauthorized AI service access — corporate data may flow to external LLM",
      },
      {
        framework: "GDPR",
        controlId: "Art.5(1)(f)",
        controlName: "Data confidentiality — AI tool risk",
        impact: "detrimental",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "Corporate data may be processed by unapproved AI — confidentiality risk",
      },
      {
        framework: "NIST_CSF",
        controlId: "PR.DS-5",
        controlName: "Data leak prevention — AI tools",
        impact: "detrimental",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "Data flow to unapproved AI tool violates data leak prevention controls",
      },
    ],
  },
  {
    eventPattern: "discovery.high_risk_grant",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.1",
        controlName: "Overprivileged OAuth grant",
        impact: "detrimental",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "OAuth grant with high-risk scopes (mail, drive, admin) to unapproved app",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.2.3",
        controlName: "Excessive privilege via OAuth",
        impact: "detrimental",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "OAuth grant provides excessive privileges to third-party application",
      },
      {
        framework: "HIPAA",
        controlId: "164.312(a)(1)",
        controlName: "Access control — broad OAuth grant",
        impact: "detrimental",
        confidence: 0.8,
        category: "shadow_discovery",
        reasoning: "Broad OAuth grant may expose PHI to unauthorized third-party service",
      },
    ],
  },
  {
    eventPattern: "discovery.app.approved",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "App approved after review",
        impact: "positive",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "Previously unknown app reviewed and approved — boundary protection maintained",
      },
      {
        framework: "ISO27001",
        controlId: "A.9.1.2",
        controlName: "Service access authorized",
        impact: "positive",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "Network service access formally authorized after discovery review",
      },
    ],
  },
  {
    eventPattern: "discovery.app.blocked",
    controls: [
      {
        framework: "SOC2",
        controlId: "CC6.6",
        controlName: "Unapproved app blocked",
        impact: "positive",
        confidence: 0.9,
        category: "shadow_discovery",
        reasoning: "Unapproved application blocked — system boundary protection enforced",
      },
      {
        framework: "GDPR",
        controlId: "Art.5(1)(f)",
        controlName: "Data protection — app blocked",
        impact: "positive",
        confidence: 0.85,
        category: "shadow_discovery",
        reasoning: "Unauthorized data processor blocked — integrity and confidentiality maintained",
      },
    ],
  },
];

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Classify a tenant event against compliance controls.
 *
 * Returns null if the event is not tenant data (internal platform events)
 * or if no classification rules match.
 */
export function classifyEvent(
  tenantId: string,
  eventType: string,
  source: string,
  actor: string,
  subject: string | null,
  payload: Record<string, unknown>,
): ClassifiedEvidence | null {
  // Skip internal platform events (no tenant context)
  if (!tenantId) return null;

  const controls: ControlClassification[] = [];

  // Special case: compliance.evidence.collected carries its own control mapping
  if (eventType === "compliance.evidence.collected") {
    const framework = payload.framework as string;
    const controlId = payload.controlId as string;
    const controlName = (payload.controlName as string) ?? controlId;
    if (framework && controlId) {
      controls.push({
        framework,
        controlId,
        controlName,
        impact: "positive",
        confidence: 0.95,
        category: "compliance_check",
        reasoning: `Evidence collected for ${framework} ${controlId} from ${source}`,
      });
    }
  }

  // Match against classification rules
  for (const rule of CLASSIFICATION_RULES) {
    if (matchesPattern(eventType, rule.eventPattern)) {
      for (const ctrl of rule.controls) {
        const impact = rule.deriveImpact ? rule.deriveImpact(payload) : ctrl.impact;

        controls.push({
          ...ctrl,
          impact,
        });
      }
    }
  }

  if (controls.length === 0) return null;

  return {
    tenantId,
    eventType,
    source,
    actor,
    subject,
    controls,
    payload,
    classifiedAt: new Date().toISOString(),
  };
}

/**
 * Get all unique frameworks affected by a classification.
 */
export function affectedFrameworks(evidence: ClassifiedEvidence): string[] {
  return [...new Set(evidence.controls.map((c) => c.framework))];
}

/**
 * Get controls with detrimental impact (compliance weakening events).
 */
export function detrimentalControls(evidence: ClassifiedEvidence): ControlClassification[] {
  return evidence.controls.filter((c) => c.impact === "detrimental");
}

/**
 * Get the highest confidence classification for a given control.
 */
export function bestClassification(
  evidence: ClassifiedEvidence,
  controlId: string,
): ControlClassification | undefined {
  return evidence.controls
    .filter((c) => c.controlId === controlId)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return eventType.startsWith(pattern.slice(0, -1));
  }
  return eventType === pattern;
}
