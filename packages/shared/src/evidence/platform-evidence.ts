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
    action: "security_policy.updated",
    controlRefs: [
      "SOC2-CC6.1",
      "SOC2-CC6.2",
      "ISO-27001-A.9.4.2",
      "HIPAA-164.312(d)",
      "NIST-CSF-PR.AC-7",
    ],
    impact: "positive",
    description: "Organization security policy updated (MFA, session, password controls)",
    category: "auth_control",
  },
  {
    action: "trust_center_settings.updated",
    controlRefs: ["SOC2-CC2.1", "SOC2-CC2.2", "GDPR-Art.5(2)"],
    impact: "positive",
    description: "Trust center transparency settings updated",
    category: "config_mgmt",
  },

  // ── Automation Rules ───────────────────────────────────────────────
  {
    action: "automation_rule.create",
    controlRefs: ["SOC2-CC8.1", "SOC2-CC6.1", "ISO-27001-A.9.2.2", "NIST-CSF-PR.IP-3"],
    impact: "positive",
    description: "Automation rule created for lifecycle management",
    category: "config_mgmt",
  },
  {
    action: "automation_rule.update",
    controlRefs: ["SOC2-CC8.1", "SOC2-CC6.1", "ISO-27001-A.9.2.2", "NIST-CSF-PR.IP-3"],
    impact: "positive",
    description: "Automation rule updated or enabled",
    category: "config_mgmt",
  },
  {
    action: "automation_rule.delete",
    controlRefs: ["SOC2-CC8.1", "NIST-CSF-PR.IP-3"],
    impact: "neutral",
    description: "Automation rule removed",
    category: "config_mgmt",
  },

  // ── Directory Sync ────────────────────────────────────────────────────
  {
    action: "directory.connect",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Directory provider connected for identity sync",
    category: "identity_mgmt",
  },
  {
    action: "directory.sync",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Directory sync executed — user roster reconciled",
    category: "identity_mgmt",
  },
  {
    action: "directory_user.created",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Directory user provisioned via sync or manual creation",
    category: "onboarding",
  },
  {
    action: "directory_user.updated",
    controlRefs: ["ISO-27001-A.9.2.4", "SOC2-CC6.3"],
    impact: "neutral",
    description: "Directory user attributes updated",
    category: "identity_mgmt",
  },
  {
    action: "directory_user.deleted",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.6", "NIST-CSF-PR.AC-1"],
    impact: "positive",
    description: "Directory user removed — offboarding triggered",
    category: "offboarding",
  },

  // ── Group-to-App Mappings ──────────────────────────────────────────
  {
    action: "mapping.update",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    impact: "positive",
    description: "Group-to-app role mapping updated",
    category: "access_grant",
  },
  {
    action: "mapping.delete",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.6"],
    impact: "positive",
    description: "Group-to-app role mapping removed",
    category: "access_revoke",
  },
  {
    action: "mapping.auto_suggest",
    controlRefs: ["SOC2-CC5.2", "SOC2-CC6.3", "ISO-27001-A.9.2.2"],
    impact: "positive",
    description: "AI-generated role mapping suggestion applied",
    category: "access_grant",
  },

  // ── Access Reviews (extended) ──────────────────────────────────────
  {
    action: "access_review_campaign.status_changed",
    controlRefs: ["SOC2-CC4.1", "SOC2-CC4.2", "ISO-27001-A.9.2.5", "HIPAA-164.312(a)(1)"],
    impact: "positive",
    description: "Access review campaign status transitioned",
    category: "access_review",
  },

  // ── Incidents (extended) ───────────────────────────────────────────
  {
    action: "incident.assigned",
    controlRefs: ["SOC2-CC7.3", "SOC2-CC7.4", "ISO-27001-A.16.1.1", "ISO-27001-A.16.1.4"],
    impact: "positive",
    description: "Incident assigned to responder",
    category: "incident_mgmt",
  },
  {
    action: "incident.escalated",
    controlRefs: ["SOC2-CC7.4", "ISO-27001-A.16.1.2", "ISO-27001-A.16.1.4", "NIST-CSF-RS.CO-2"],
    impact: "positive",
    description: "Incident escalated per response procedure",
    category: "incident_mgmt",
  },
  {
    action: "incident.severity_changed",
    controlRefs: ["SOC2-CC7.4", "ISO-27001-A.16.1.2"],
    impact: "neutral",
    description: "Incident severity reclassified",
    category: "incident_mgmt",
  },

  // ── MFA ─────────────────────────────────────────────────────────────
  {
    action: "mfa.totp_enabled",
    controlRefs: [
      "SOC2-CC6.1",
      "SOC2-CC6.2",
      "ISO-27001-A.9.4.2",
      "HIPAA-164.312(d)",
      "NIST-CSF-PR.AC-7",
    ],
    impact: "positive",
    description: "User enabled multi-factor authentication (TOTP)",
    category: "auth_control",
  },
  {
    action: "mfa.totp_disabled",
    controlRefs: [
      "SOC2-CC6.1",
      "SOC2-CC6.2",
      "ISO-27001-A.9.4.2",
      "HIPAA-164.312(d)",
      "NIST-CSF-PR.AC-7",
    ],
    impact: "detrimental",
    description: "User disabled multi-factor authentication (TOTP)",
    category: "auth_control",
  },

  // ── Policy Management ──────────────────────────────────────────────
  {
    action: "policy.created",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.5.1.1", "GDPR-Art.5(2)"],
    impact: "positive",
    description: "Security/compliance policy document created",
    category: "policy_mgmt",
  },
  {
    action: "policy.updated",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.5.1.1", "GDPR-Art.5(2)"],
    impact: "positive",
    description: "Security/compliance policy document revised",
    category: "policy_mgmt",
  },
  {
    action: "policy.archived",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.5.1.1"],
    impact: "neutral",
    description: "Policy document archived after supersession",
    category: "policy_mgmt",
  },
  {
    action: "policy.submitted_for_review",
    controlRefs: ["SOC2-CC5.1", "SOC2-CC2.1", "ISO-27001-A.5.1.1"],
    impact: "positive",
    description: "Policy submitted for management review and approval",
    category: "policy_mgmt",
  },

  // ── Compliance Packs ───────────────────────────────────────────────
  {
    action: "compliance_pack.create",
    controlRefs: ["SOC2-CC5.1", "SOC2-CC3.1", "ISO-27001-A.9.1.1"],
    impact: "positive",
    description: "Custom compliance pack created",
    category: "config_mgmt",
  },
  {
    action: "compliance_pack.install",
    controlRefs: ["SOC2-CC5.1", "SOC2-CC3.1", "ISO-27001-A.9.1.1"],
    impact: "positive",
    description: "Compliance pack installed — controls activated",
    category: "config_mgmt",
  },
  {
    action: "compliance_pack.uninstall",
    controlRefs: ["SOC2-CC5.1"],
    impact: "neutral",
    description: "Compliance pack uninstalled",
    category: "config_mgmt",
  },
  {
    action: "compliance_pack.update",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.9.1.1"],
    impact: "positive",
    description: "Compliance pack configuration updated",
    category: "config_mgmt",
  },
  {
    action: "compliance_pack.delete",
    controlRefs: ["SOC2-CC5.1"],
    impact: "neutral",
    description: "Custom compliance pack deleted",
    category: "config_mgmt",
  },

  // ── Automation Execution ───────────────────────────────────────────
  {
    action: "automation.executed",
    controlRefs: ["SOC2-CC8.1", "SOC2-CC5.2", "ISO-27001-A.9.2.2", "NIST-CSF-PR.IP-3"],
    impact: "positive",
    description: "Automation rule executed — lifecycle action performed",
    category: "automation",
  },
  {
    action: "automation_rule.duplicate",
    controlRefs: ["SOC2-CC8.1", "NIST-CSF-PR.IP-3"],
    impact: "neutral",
    description: "Automation rule duplicated from existing template",
    category: "config_mgmt",
  },

  // ── Trust Center ───────────────────────────────────────────────────
  {
    action: "trust_access_request.approved",
    controlRefs: ["SOC2-CC2.1", "SOC2-CC2.2", "GDPR-Art.5(2)"],
    impact: "positive",
    description: "Trust center access request approved — transparency upheld",
    category: "config_mgmt",
  },
  {
    action: "trust_access_request.denied",
    controlRefs: ["SOC2-CC2.1", "SOC2-CC6.3"],
    impact: "positive",
    description: "Trust center access request denied — need-to-know enforced",
    category: "access_revoke",
  },

  // ── Support ────────────────────────────────────────────────────────
  {
    action: "support.request",
    controlRefs: ["SOC2-CC2.2", "ISO-27001-A.16.1.2"],
    impact: "neutral",
    description: "Support request submitted by user",
    category: "incident_mgmt",
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
  // ── P1-4 expanded probes ────────────────────────────────────────────
  {
    id: "rbac_role_entitlements_configured",
    controlRefs: ["SOC2-CC5.2", "SOC2-CC6.1", "ISO-27001-A.9.2.2", "NIST-CSF-PR.AC-4"],
    description: "RBAC roles with app entitlements configured (enforces segregation of duties)",
    category: "access_control",
    query: `SELECT COUNT(*) AS result FROM role_entitlements WHERE tenant_id = ?`,
  },
  {
    id: "encryption_evidence_present",
    controlRefs: ["SOC2-CC6.7", "HIPAA-164.312(a)(2)(iv)", "GDPR-Art.5(1)(f)"],
    description: "Encryption-related evidence collected from adapters",
    category: "data_protection",
    query: `SELECT COUNT(*) AS result FROM compliance_evidence WHERE tenant_id = ? AND (control_id LIKE 'CC6.7%' OR evidence_type = 'encryption_status' OR evidence_type = 'encryption_at_rest') AND created_at >= datetime('now', '-30 days')`,
  },
  {
    id: "directory_sync_recent",
    controlRefs: ["SOC2-CC6.2", "ISO-27001-A.9.2.1", "NIST-CSF-PR.AC-1"],
    description: "Directory sync has run recently (within 24 hours)",
    category: "identity_mgmt",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE tenant_id = ? AND action IN ('directory.synced', 'directory_sync.completed') AND created_at >= datetime('now', '-24 hours')`,
  },
  {
    id: "automation_rules_active",
    controlRefs: ["SOC2-CC4.1", "SOC2-CC8.1", "ISO-27001-A.12.6.1", "NIST-CSF-PR.IP-3"],
    description: "Active automation rules configured for lifecycle management",
    category: "config_mgmt",
    query: `SELECT COUNT(*) AS result FROM automation_rules WHERE tenant_id = ? AND enabled = 1`,
  },
  {
    id: "nhi_credentials_managed",
    controlRefs: ["SOC2-CC6.1", "SOC2-CC6.7", "ISO-27001-A.9.4.2"],
    description: "Non-human identity credentials tracked and managed",
    category: "credential_mgmt",
    query: `SELECT COUNT(*) AS result FROM nhi_credentials WHERE tenant_id = ? AND status = 'active'`,
  },
  {
    id: "policies_uploaded",
    controlRefs: ["SOC2-CC5.1", "ISO-27001-A.5.1.1", "GDPR-Art.5(2)"],
    description: "Security policies uploaded to evidence locker",
    category: "policy_mgmt",
    query: `SELECT COUNT(*) AS result FROM compliance_evidence WHERE tenant_id = ? AND evidence_type = 'policy' AND created_at >= datetime('now', '-365 days')`,
  },
  {
    id: "mfa_enforced",
    controlRefs: [
      "SOC2-CC6.1",
      "SOC2-CC6.2",
      "ISO-27001-A.9.4.2",
      "HIPAA-164.312(d)",
      "NIST-CSF-PR.AC-7",
    ],
    description: "MFA required for all users via organization security policy",
    category: "auth_control",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key = 'security_policy' AND json_extract(value, '$.mfaRequired') = true`,
  },

  // ── Extended probes for partial/gap controls ────────────────────────
  {
    id: "incident_response_plan_uploaded",
    controlRefs: ["SOC2-CC7.3", "SOC2-CC7.5", "ISO-27001-A.16.1.1"],
    description: "Incident response plan uploaded as policy evidence",
    category: "incident_mgmt",
    query: `SELECT COUNT(*) AS result FROM compliance_evidence WHERE tenant_id = ? AND evidence_type = 'policy' AND (control_name LIKE '%incident%' OR subject LIKE '%incident%response%') AND created_at >= datetime('now', '-365 days')`,
  },
  {
    id: "continuous_monitoring_active",
    controlRefs: ["SOC2-CC4.1", "SOC2-CC7.1", "NIST-CSF-DE.CM-1"],
    description: "Continuous monitoring active — automation rules and audit logging running",
    category: "monitoring",
    query: `SELECT CASE WHEN (SELECT COUNT(*) FROM automation_rules WHERE tenant_id = ? AND enabled = 1) > 0 AND (SELECT COUNT(*) FROM audit_log WHERE tenant_id = ? AND created_at >= datetime('now', '-24 hours')) > 0 THEN 1 ELSE 0 END AS result`,
  },
  {
    id: "access_request_approval_enforced",
    controlRefs: ["ISO-27001-A.9.2.2", "SOC2-CC6.3"],
    description: "Access requests require approval before fulfillment",
    category: "access_control",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE tenant_id = ? AND action = 'access_request.approved' AND created_at >= datetime('now', '-90 days')`,
  },
  {
    id: "offboarding_within_sla",
    controlRefs: ["SOC2-CC6.3", "ISO-27001-A.9.2.6"],
    description: "User offboarding events completed within SLA window",
    category: "offboarding",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE tenant_id = ? AND action IN ('user.deleted', 'group_member.removed') AND created_at >= datetime('now', '-90 days')`,
  },
  {
    id: "incident_resolution_tracked",
    controlRefs: ["SOC2-CC7.4", "ISO-27001-A.16.1.4", "NIST-CSF-RS.CO-2"],
    description: "Incidents resolved with documented timelines",
    category: "incident_mgmt",
    query: `SELECT COUNT(*) AS result FROM incidents WHERE tenant_id = ? AND status = 'resolved' AND resolved_at IS NOT NULL`,
  },
  {
    id: "session_timeout_configured",
    controlRefs: ["HIPAA-164.312(a)(2)(ii)", "SOC2-CC6.7"],
    description: "Session auto-logoff timeout configured in security policy",
    category: "auth_control",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key = 'security_policy' AND json_extract(value, '$.sessionTimeoutMins') IS NOT NULL`,
  },
  {
    id: "audit_log_retention_configured",
    controlRefs: ["HIPAA-164.312(b)", "GDPR-Art.5(1)(e)", "GDPR-Art.5(2)"],
    description: "Audit log retention policy configured",
    category: "data_lifecycle",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key IN ('data_retention', 'audit_retention')`,
  },
  {
    id: "idp_connected",
    controlRefs: ["NIST-CSF-PR.AC-1", "SOC2-CC6.2", "ISO-27001-A.9.2.1"],
    description: "Identity provider connected for federated authentication",
    category: "identity_mgmt",
    query: `SELECT COUNT(*) AS result FROM integrations WHERE tenant_id = ? AND status = 'connected' AND slug IN ('okta', 'azure-ad', 'google-workspace', 'auth0', 'onelogin', 'jumpcloud', 'ping-identity')`,
  },
  {
    id: "change_management_tracked",
    controlRefs: ["SOC2-CC8.1", "SOC2-CC5.3"],
    description: "Change management tracked via automation rule audit trail",
    category: "config_mgmt",
    query: `SELECT COUNT(*) AS result FROM audit_log WHERE tenant_id = ? AND action IN ('automation_rule.create', 'automation_rule.update', 'automation_rule.delete') AND created_at >= datetime('now', '-90 days')`,
  },
  {
    id: "trust_center_configured",
    controlRefs: ["SOC2-CC2.1", "SOC2-CC2.2", "GDPR-Art.5(2)"],
    description: "Trust center configured for stakeholder transparency",
    category: "config_mgmt",
    query: `SELECT COUNT(*) AS result FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_settings'`,
  },
  {
    id: "security_events_reported",
    controlRefs: ["ISO-27001-A.16.1.2", "SOC2-CC7.3", "NIST-CSF-RS.CO-2"],
    description: "Security events reported through incident management",
    category: "incident_mgmt",
    query: `SELECT COUNT(*) AS result FROM incidents WHERE tenant_id = ? AND created_at >= datetime('now', '-365 days')`,
  },
];
