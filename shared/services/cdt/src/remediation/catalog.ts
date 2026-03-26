/**
 * Remediation Catalog
 *
 * Maps compliance control IDs to automated remediation action names.
 * Each action name corresponds to a handler in the remediation queue consumer.
 *
 * Only controls with clear, automated remediation paths are included.
 * Manual-only controls (e.g., physical security, password policy) are omitted.
 */
export const remediationCatalog: Record<string, string[]> = {
  // ── SOC2 CC1 — Control Environment ─────────────────────────────────────
  "SOC2-CC1.1": ["notify_admin_policy_review"],

  // ── SOC2 CC2 — Communication ───────────────────────────────────────────
  "SOC2-CC2.1": ["send_compliance_status_report"],

  // ── SOC2 CC4 — Monitoring ──────────────────────────────────────────────
  "SOC2-CC4.1": ["enable_audit_logging"],

  // ── SOC2 CC6 — Logical Access ──────────────────────────────────────────
  "SOC2-CC6.1": ["trigger_access_review", "revoke_stale_access"],
  "SOC2-CC6.2": ["enforce_idp_mfa"],
  "SOC2-CC6.3": ["revoke_terminated_user_access", "trigger_offboarding_workflow"],
  "SOC2-CC6.6": ["enforce_network_boundary_rules"],
  "SOC2-CC6.7": ["enforce_branch_protection"],
  "SOC2-CC6.8": ["enforce_idp_mfa", "enable_security_scanning"],

  // ── SOC2 CC7 — Operations ──────────────────────────────────────────────
  "SOC2-CC7.1": ["enable_config_change_detection"],
  "SOC2-CC7.2": ["enable_anomaly_monitoring"],
  "SOC2-CC7.3": ["create_incident_from_finding"],
  "SOC2-CC7.4": ["escalate_incident_to_ops"],
  "SOC2-CC7.5": ["create_post_incident_review"],

  // ── SOC2 CC8 — Change Management ───────────────────────────────────────
  "SOC2-CC8.1": ["enforce_branch_protection", "require_pr_approval"],

  // ── SOC2 CC9 — Risk Mitigation ─────────────────────────────────────────
  "SOC2-CC9.1": ["trigger_risk_assessment"],

  // ── ISO 27001 A.9 — Access Control ─────────────────────────────────────
  "ISO-27001-A.9.1.1": ["notify_admin_policy_review"],
  "ISO-27001-A.9.2.1": ["expedite_joiner_workflow", "trigger_access_review"],
  "ISO-27001-A.9.2.2": ["expedite_joiner_workflow"],
  "ISO-27001-A.9.2.3": ["expedite_joiner_workflow", "revoke_excess_privileges"],
  "ISO-27001-A.9.2.5": ["trigger_access_review"],
  "ISO-27001-A.9.2.6": ["revoke_terminated_user_access", "trigger_offboarding_workflow"],
  "ISO-27001-A.9.4.2": ["enforce_idp_mfa"],

  // ── ISO 27001 A.12/A.13 — Operations / Network ─────────────────────────
  "ISO-27001-A.12.6.1": ["enable_security_scanning", "enforce_branch_protection"],
  "ISO-27001-A.13.1.1": ["enforce_network_boundary_rules"],

  // ── ISO 27001 A.16 — Incident Management ───────────────────────────────
  "ISO-27001-A.16.1.1": ["enable_audit_logging"],
  "ISO-27001-A.16.1.2": ["create_incident_from_finding"],
  "ISO-27001-A.16.1.4": ["escalate_incident_to_ops"],

  // ── HIPAA Technical Safeguards ──────────────────────────────────────────
  "HIPAA-164.312(a)(1)": ["trigger_access_review", "revoke_stale_access"],
  "HIPAA-164.312(a)(2)(i)": ["enforce_idp_mfa"],
  "HIPAA-164.312(a)(2)(ii)": ["enforce_encryption_at_rest"],
  "HIPAA-164.312(b)": ["enable_audit_logging"],
  "HIPAA-164.312(c)(1)": ["enable_integrity_monitoring"],
  "HIPAA-164.312(d)": ["enforce_idp_mfa"],

  // ── NIST CSF ───────────────────────────────────────────────────────────
  "NIST-CSF-PR.AC-1": ["expedite_joiner_workflow", "trigger_access_review"],
  "NIST-CSF-PR.AC-3": ["enforce_network_boundary_rules"],
  "NIST-CSF-PR.AC-4": ["revoke_excess_privileges"],
  "NIST-CSF-RS.CO-2": ["escalate_incident_to_ops"],
  "NIST-CSF-DE.CM-1": ["enable_config_change_detection", "enable_anomaly_monitoring"],

  // ── GDPR Article 5 ─────────────────────────────────────────────────────
  "GDPR-Art.5(1)(f)": ["enforce_encryption_at_rest", "revoke_terminated_user_access"],
};
