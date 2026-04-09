/**
 * Action → Compliance Control Mapping
 *
 * Maps each AutomationRule ActionType to the compliance framework controls it satisfies.
 * This is the core of AtlasIT's "lifecycle automation IS compliance" value proposition:
 * every automation action is evidence for specific controls across SOC 2, ISO 27001,
 * NIST CSF, HIPAA, and GDPR frameworks.
 *
 * Used by:
 *   - ai-orchestrator automation-evaluator (emitComplianceEvidence): inserts
 *     compliance_evidence rows after successful action execution
 *   - compliance-worker getCoverage: factors automation evidence into coverage scores
 */

export interface ComplianceControlRef {
  framework: "SOC2" | "ISO27001" | "NIST_CSF" | "HIPAA" | "GDPR";
  controlId: string; // e.g. "CC6.1", "A.9.2.2", "PR.AC-1"
  controlName: string;
  evidenceType:
    | "access_grant"
    | "access_revoke"
    | "offboarding"
    | "incident"
    | "policy_change"
    | "audit_log";
}

/** Alias for backward compat with automation-evaluator emitComplianceEvidence */
export type ControlMapping = ComplianceControlRef;

export const ACTION_COMPLIANCE_MAP: Record<string, ComplianceControlRef[]> = {
  provision_app_access: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Logical access provisioning",
      evidenceType: "access_grant",
    },
    {
      framework: "SOC2",
      controlId: "CC6.2",
      controlName: "MFA enforced at provisioning",
      evidenceType: "access_grant",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.2",
      controlName: "User access provisioning",
      evidenceType: "access_grant",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.3",
      controlName: "Management of privileged access rights",
      evidenceType: "access_grant",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
      controlName: "Identities and credentials managed",
      evidenceType: "access_grant",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(a)(1)",
      controlName: "Unique user identification",
      evidenceType: "access_grant",
    },
  ],

  revoke_app_access: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Logical access removal",
      evidenceType: "access_revoke",
    },
    {
      framework: "SOC2",
      controlId: "CC6.3",
      controlName: "Offboarding access removal",
      evidenceType: "access_revoke",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.6",
      controlName: "Removal of access rights",
      evidenceType: "access_revoke",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
      controlName: "Identities and credentials managed",
      evidenceType: "access_revoke",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(a)(2)(i)",
      controlName: "Unique user identification",
      evidenceType: "access_revoke",
    },
    {
      framework: "GDPR",
      controlId: "Art.5(1)(f)",
      controlName: "Integrity and confidentiality",
      evidenceType: "access_revoke",
    },
  ],

  run_workflow: [
    {
      framework: "SOC2",
      controlId: "CC6.3",
      controlName: "Offboarding / role change procedures",
      evidenceType: "offboarding",
    },
    {
      framework: "SOC2",
      controlId: "CC8.1",
      controlName: "Authorized change execution",
      evidenceType: "audit_log",
    },
    {
      framework: "ISO27001",
      controlId: "A.7.3.1",
      controlName: "Termination responsibilities",
      evidenceType: "offboarding",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.IP-3",
      controlName: "Configuration change control processes",
      evidenceType: "audit_log",
    },
  ],

  create_incident: [
    {
      framework: "SOC2",
      controlId: "CC7.4",
      controlName: "Incident response procedures",
      evidenceType: "incident",
    },
    {
      framework: "SOC2",
      controlId: "CC7.3",
      controlName: "Incident response plan tested",
      evidenceType: "incident",
    },
    {
      framework: "ISO27001",
      controlId: "A.16.1.2",
      controlName: "Reporting information security events",
      evidenceType: "incident",
    },
    {
      framework: "ISO27001",
      controlId: "A.16.1.4",
      controlName: "Assessment and decision on events",
      evidenceType: "incident",
    },
    {
      framework: "NIST_CSF",
      controlId: "RS.CO-2",
      controlName: "Incidents reported",
      evidenceType: "incident",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(b)",
      controlName: "Audit controls — security event log",
      evidenceType: "incident",
    },
  ],

  assign_role: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Role-based access control",
      evidenceType: "access_grant",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.3",
      controlName: "Management of privileged access rights",
      evidenceType: "access_grant",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.4.1",
      controlName: "Information access restriction by role",
      evidenceType: "access_grant",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-4",
      controlName: "Access permissions managed (least priv)",
      evidenceType: "access_grant",
    },
  ],

  remove_role: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Privileged access removal",
      evidenceType: "access_revoke",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.3",
      controlName: "Management of privileged access rights",
      evidenceType: "access_revoke",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-4",
      controlName: "Access permissions managed (least priv)",
      evidenceType: "access_revoke",
    },
  ],

  sync_directory: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Directory synchronization audit",
      evidenceType: "audit_log",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.1",
      controlName: "User registration and de-registration",
      evidenceType: "audit_log",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
      controlName: "Identities and credentials managed",
      evidenceType: "audit_log",
    },
  ],

  update_compliance_status: [
    {
      framework: "SOC2",
      controlId: "CC4.1",
      controlName: "Monitoring of controls",
      evidenceType: "policy_change",
    },
    {
      framework: "SOC2",
      controlId: "CC4.2",
      controlName: "Independent evaluation of controls",
      evidenceType: "policy_change",
    },
    {
      framework: "ISO27001",
      controlId: "A.18.2.1",
      controlName: "Independent review of information security",
      evidenceType: "policy_change",
    },
  ],

  send_notification: [
    {
      framework: "SOC2",
      controlId: "CC2.1",
      controlName: "Security policies communicated",
      evidenceType: "audit_log",
    },
    {
      framework: "ISO27001",
      controlId: "A.16.1.2",
      controlName: "Reporting information security events",
      evidenceType: "audit_log",
    },
  ],

  request_access_review: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "Periodic access review initiated",
      evidenceType: "audit_log",
    },
    {
      framework: "SOC2",
      controlId: "CC6.3",
      controlName: "Access review for role/termination changes",
      evidenceType: "audit_log",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.5",
      controlName: "Review of user access rights",
      evidenceType: "audit_log",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(a)(1)",
      controlName: "Access control review",
      evidenceType: "audit_log",
    },
  ],

  rotate_nhi_credential: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "NHI credential lifecycle management",
      evidenceType: "access_revoke",
    },
    {
      framework: "SOC2",
      controlId: "CC6.6",
      controlName: "System operations credential management",
      evidenceType: "access_revoke",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.3",
      controlName: "Management of secret authentication info",
      evidenceType: "access_revoke",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.6",
      controlName: "Removal or adjustment of access rights",
      evidenceType: "access_revoke",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
      controlName: "NHI credential rotation",
      evidenceType: "access_revoke",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(d)",
      controlName: "Person or entity authentication",
      evidenceType: "access_revoke",
    },
  ],

  revoke_nhi_token: [
    {
      framework: "SOC2",
      controlId: "CC6.1",
      controlName: "NHI token revocation",
      evidenceType: "access_revoke",
    },
    {
      framework: "SOC2",
      controlId: "CC6.3",
      controlName: "NHI offboarding access removal",
      evidenceType: "access_revoke",
    },
    {
      framework: "SOC2",
      controlId: "CC6.6",
      controlName: "System credential decommissioning",
      evidenceType: "access_revoke",
    },
    {
      framework: "ISO27001",
      controlId: "A.9.2.6",
      controlName: "Removal of NHI access rights",
      evidenceType: "access_revoke",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
      controlName: "NHI credential revocation",
      evidenceType: "access_revoke",
    },
    {
      framework: "NIST_CSF",
      controlId: "PR.AC-3",
      controlName: "Remote access managed",
      evidenceType: "access_revoke",
    },
    {
      framework: "HIPAA",
      controlId: "164.312(d)",
      controlName: "Person or entity authentication",
      evidenceType: "access_revoke",
    },
    {
      framework: "GDPR",
      controlId: "Art.5(1)(f)",
      controlName: "Integrity and confidentiality",
      evidenceType: "access_revoke",
    },
  ],
};
