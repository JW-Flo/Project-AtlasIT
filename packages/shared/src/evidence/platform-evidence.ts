/**
 * Platform evidence — maps AtlasIT's own audit actions and system state
 * to compliance control references. This lets the evidence locker show
 * real compliance-relevant activity from day one, without external adapters.
 *
 * Two collection modes:
 *   1. **Event-driven** — writeAudit() dual-writes a compliance_evidence row
 *      when the action matches a known mapping (real-time).
 *   2. **State-based** — a cron scans D1 tables for structural evidence
 *      (e.g. RBAC groups exist, audit logging active, retention configured).
 */

// ── Event-driven mappings ─────────────────────────────────────────────────

export interface AuditEvidenceMapping {
  /** audit_log.action value */
  action: string;
  /** Compliance control refs this action provides evidence for */
  controlRefs: string[];
  /** positive = supports compliance, detrimental = risk indicator */
  impact: "positive" | "detrimental" | "neutral";
  /** Human description for the evidence feed */
  description: string;
  /** Evidence category for filtering */
  category: string;
}

/**
 * Registry mapping platform audit actions → compliance evidence.
 *
 * Every writeAudit() call checks this registry. When the action matches,
 * a compliance_evidence row is created alongside the audit_log row.
 */
export const AUDIT_EVIDENCE_REGISTRY: AuditEvidenceMapping[] = [
  // ── Access Management ───────────────────────────────────────────────
  {
    action: "access_request.created",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Access request submitted through formal workflow",
    category: "access_grant",
  },
  {
    action: "access_request.approved",
    controlRefs: [
      "SOC2-CC6.2",
      "SOC2-CC6.3",
      "ISO-27001-A.9.2.2",
      "NIST-CSF-PR.AC-1",
      "HIPAA-164.312(a)(1)",
    ],
    impact: "positive",
    description: "Access request approved with authorization",
    category: "access_grant",
  },
  {
    action: "access_request.denied",
    controlRefs: ["SOC2-CC6.2", "SOC2-CC6.3", "ISO-27001-A.9.2.2"],
    impact: "positive",
    description: "Unauthorized access request denied",
    category: "access_grant",
  },
  {
    action: "access_request.fulfilled",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.2"],
    impact: "positive",
    description: "Approved access provisioned to user",
    category: "access_grant",
  },

  // ── User Lifecycle ──────────────────────────────────────────────────
  {
    action: "user.invited",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "New user invited through managed provisioning",
    category: "onboarding",
  },
  {
    action: "user.roles_updated",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4", "HIPAA-164.312(a)(1)"],
    impact: "positive",
    description: "User role assignment updated",
    category: "access_grant",
  },
  {
    action: "user.deleted",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.6", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "User account deprovisioned",
    category: "offboarding",
  },
  {
    action: "user.password_changed",
    controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1", "HIPAA-164.312(d)"],
    impact: "positive",
    description: "User credential rotated",
    category: "credential_mgmt",
  },
  {
    action: "user.profile_updated",
    controlRefs: ["ISO-27001-A.9.2.4"],
    impact: "neutral",
    description: "User profile information maintained",
    category: "identity_mgmt",
  },

  // ── Directory & Groups ──────────────────────────────────────────────
  {
    action: "directory_group.created",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    impact: "positive",
    description: "RBAC group created for role-based access control",
    category: "access_grant",
  },
  {
    action: "directory_group.updated",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2"],
    impact: "positive",
    description: "Access group configuration updated",
    category: "access_grant",
  },
  {
    action: "directory_group.deleted",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.6"],
    impact: "positive",
    description: "Unused access group removed",
    category: "access_revoke",
  },
  {
    action: "group_member.added",
    controlRefs: ["SOC2-CC6.2", "SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    impact: "positive",
    description: "User assigned to role-based access group",
    category: "access_grant",
  },
  {
    action: "group_member.removed",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.6", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "User removed from access group",
    category: "access_revoke",
  },
  {
    action: "mapping.create",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    impact: "positive",
    description: "Group-to-app role mapping configured",
    category: "access_grant",
  },

  // ── Access Reviews ──────────────────────────────────────────────────
  {
    action: "access_review.campaign_created",
    controlRefs: ["SOC2-CC4.1", "SOC2-CC4.2", "ISO-27001-A.9.2.5", "HIPAA-164.312(a)(1)"],
    impact: "positive",
    description: "Periodic access review campaign initiated",
    category: "access_review",
  },
  {
    action: "access_review.decision",
    controlRefs: ["SOC2-CC4.1", "ISO-27001-A.9.2.5", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Access review decision recorded",
    category: "access_review",
  },

  // ── Incidents ───────────────────────────────────────────────────────
  {
    action: "incident.created",
    controlRefs: [
      "SOC2-CC7.3",
      "SOC2-CC7.4",
      "ISO-27001-A.16.1.1",
      "ISO-27001-A.16.1.2",
      "NIST-CSF-RS.CO-2",
    ],
    impact: "positive",
    description: "Security incident formally reported",
    category: "incident_mgmt",
  },
  {
    action: "incident.updated",
    controlRefs: ["SOC2-CC7.4", "ISO-27001-A.16.1.2"],
    impact: "positive",
    description: "Incident response action documented",
    category: "incident_mgmt",
  },
  {
    action: "incident.resolved",
    controlRefs: ["SOC2-CC7.4", "SOC2-CC7.5", "ISO-27001-A.16.1.4"],
    impact: "positive",
    description: "Incident resolved with documented remediation",
    category: "incident_mgmt",
  },

  // ── App Integrations ────────────────────────────────────────────────
  {
    action: "app.connected",
    controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.4.1"],
    impact: "positive",
    description: "Application integration established",
    category: "integration_mgmt",
  },
  {
    action: "app.oauth_connected",
    controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.4.1"],
    impact: "positive",
    description: "OAuth-based application connected",
    category: "integration_mgmt",
  },
  {
    action: "app.disconnected",
    controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.2.6"],
    impact: "positive",
    description: "Application integration revoked",
    category: "access_revoke",
  },

  // ── Tenant & Settings ───────────────────────────────────────────────
  {
    action: "tenant.settings_updated",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.9.1.1"],
    impact: "positive",
    description: "Organizational security settings updated",
    category: "config_mgmt",
  },
  {
    action: "trust_center_settings.updated",
    controlRefs: ["SOC2-CC2.1", "SOC2-CC2.2", "GDPR-Art.5(2)"],
    impact: "positive",
    description: "Trust center transparency settings updated",
    category: "config_mgmt",
  },

  // ── Admin Actions ───────────────────────────────────────────────────
  {
    action: "tenant.impersonate",
    controlRefs: ["SOC2-CC6.8", "ISO-27001-A.9.4.2", "HIPAA-164.312(a)(1)"],
    impact: "detrimental",
    description: "Privileged admin impersonation session started",
    category: "privileged_access",
  },
  {
    action: "tenant.deleted",
    controlRefs: ["SOC2-CC6.7", "GDPR-Art.5(1)(e)"],
    impact: "neutral",
    description: "Tenant data lifecycle event — deletion",
    category: "data_lifecycle",
  },
];

/** Lookup index built once at import time */
const AUDIT_EVIDENCE_INDEX = new Map<string, AuditEvidenceMapping>();
for (const m of AUDIT_EVIDENCE_REGISTRY) {
  AUDIT_EVIDENCE_INDEX.set(m.action, m);
}

export function lookupAuditEvidence(action: string): AuditEvidenceMapping | undefined {
  return AUDIT_EVIDENCE_INDEX.get(action);
}

// ── State-based evidence probes ───────────────────────────────────────────

export interface PlatformStateProbe {
  id: string;
  controlRefs: string[];
  description: string;
  category: string;
  /**
   * SQL query that returns { result: number } — a non-zero value means
   * the control condition is satisfied (pass), zero means fail.
   */
  query: string;
}

/**
 * Probes that scan D1 tables to derive evidence from platform state.
 * Run periodically (cron) rather than per-event.
 */
export const PLATFORM_STATE_PROBES: PlatformStateProbe[] = [
  {
    id: "audit_logging_active",
    controlRefs: [
      "SOC2-CC7.1",
      "SOC2-CC4.1",
      "HIPAA-164.312(b)",
      "NIST-CSF-DE.CM-1",
      "ISO-27001-A.12.6.1",
    ],
    description: "Platform audit logging is active (recent entries exist)",
    category: "monitoring",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE created_at >= datetime('now', '-24 hours')`,
  },
  {
    id: "rbac_groups_configured",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    description: "Role-based access groups are configured",
    category: "access_control",
    query: `SELECT COUNT(*) AS result FROM directory_groups WHERE tenant_id = ?`,
  },
  {
    id: "active_users_managed",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1"],
    description: "User directory actively managed with recent changes",
    category: "identity_mgmt",
    query: `SELECT COUNT(*) AS result FROM users WHERE tenant_id = ? AND status = 'active'`,
  },
  {
    id: "user_roles_assigned",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "HIPAA-164.312(a)(1)"],
    description: "Users have explicit role assignments",
    category: "access_control",
    query: `SELECT COUNT(*) AS result FROM console_user_roles WHERE tenant_id = ?`,
  },
  {
    id: "access_reviews_conducted",
    controlRefs: ["SOC2-CC4.1", "SOC2-CC4.2", "ISO-27001-A.9.2.5", "HIPAA-164.312(a)(1)"],
    description: "Periodic access review campaigns have been conducted",
    category: "access_review",
    query: `SELECT COUNT(*) AS result FROM access_review_campaigns WHERE tenant_id = ? AND created_at >= datetime('now', '-90 days')`,
  },
  {
    id: "incidents_tracked",
    controlRefs: ["SOC2-CC7.3", "ISO-27001-A.16.1.1", "NIST-CSF-RS.CO-2"],
    description: "Incident management process in use",
    category: "incident_mgmt",
    query: `SELECT COUNT(*) AS result FROM incidents WHERE tenant_id = ?`,
  },
  {
    id: "integrations_connected",
    controlRefs: ["SOC2-CC6.6", "ISO-27001-A.9.4.1"],
    description: "Application integrations established for visibility",
    category: "integration_mgmt",
    query: `SELECT COUNT(*) AS result FROM integrations WHERE tenant_id = ? AND status = 'connected'`,
  },
  {
    id: "onboarding_completed",
    controlRefs: ["SOC2-CC1.1", "SOC2-CC5.1", "ISO-27001-A.9.1.1"],
    description: "Tenant onboarding with security baseline completed",
    category: "config_mgmt",
    query: `SELECT COUNT(*) AS result FROM onboarding_sessions WHERE tenant_id = ? AND status = 'completed'`,
  },
  {
    id: "group_app_mappings_configured",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    description: "Group-to-application role mappings configured (automated provisioning)",
    category: "access_control",
    query: `SELECT COUNT(*) AS result FROM group_app_mappings WHERE tenant_id = ?`,
  },
  {
    id: "data_retention_configured",
    controlRefs: ["GDPR-Art.5(1)(e)", "SOC2-CC6.6"],
    description: "Tenant preferences include data retention policy",
    category: "data_lifecycle",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key = 'data_retention'`,
  },
  {
    id: "compliance_frameworks_enabled",
    controlRefs: ["SOC2-CC1.1", "SOC2-CC3.1", "ISO-27001-A.9.1.1"],
    description: "Compliance frameworks selected and actively tracked",
    category: "config_mgmt",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_frameworks'`,
  },
  {
    id: "password_changes_recent",
    controlRefs: ["SOC2-CC6.1", "ISO-27001-A.9.3.1", "HIPAA-164.312(d)"],
    description: "Credential rotation occurring within policy window",
    category: "credential_mgmt",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE tenant_id = ? AND action = 'user.password_changed' AND created_at >= datetime('now', '-90 days')`,
  },
];
