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
    framework: 'SOC2' | 'ISO27001' | 'NIST_CSF' | 'HIPAA' | 'GDPR';
    controlId: string;
    controlName: string;
    evidenceType: 'access_grant' | 'access_revoke' | 'offboarding' | 'incident' | 'policy_change' | 'audit_log';
}
/** Alias for backward compat with automation-evaluator emitComplianceEvidence */
export type ControlMapping = ComplianceControlRef;
export declare const ACTION_COMPLIANCE_MAP: Record<string, ComplianceControlRef[]>;
//# sourceMappingURL=compliance-mapping.d.ts.map