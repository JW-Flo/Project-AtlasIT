/**
 * Maps automation action types to the compliance framework controls they satisfy.
 *
 * When an action executes successfully, the evaluator uses this map to emit
 * evidence records into `compliance_evidence`, which the compliance-worker then
 * factors into coverage scores.
 *
 * Each entry carries:
 *   - framework   : The compliance framework key (must match internal_controls.framework)
 *   - controlId   : The control key (must match internal_controls.control_key)
 *   - controlName : Human-readable label (informational)
 *   - evidenceType: Category tag stored on the evidence row
 */
/**
 * ACTION_COMPLIANCE_MAP — action type → list of controls satisfied.
 *
 * Covers the 3 highest-value action types fully; remaining action types
 * carry partial mappings. Extend as framework coverage expands.
 *
 * TODO: import full map from packages/shared/src/automation/compliance-mapping.ts
 * once the CDT rules agent generates the complete 24-app version.
 */
export const ACTION_COMPLIANCE_MAP = {
    // ── Identity & Access Provisioning ──────────────────────────────────────────
    provision_app_access: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC6.1",
            controlName: "Logical access",
            evidenceType: "access_provisioning",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.9",
            controlName: "Access control",
            evidenceType: "access_provisioning",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_PR",
            controlName: "Protect",
            evidenceType: "access_provisioning",
        },
    ],
    // ── Identity & Access Revocation ────────────────────────────────────────────
    revoke_app_access: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC6.1",
            controlName: "Logical access",
            evidenceType: "access_revocation",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.9",
            controlName: "Access control",
            evidenceType: "access_revocation",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_PR",
            controlName: "Protect",
            evidenceType: "access_revocation",
        },
    ],
    // ── Workflow Execution (joiner/mover/leaver) ─────────────────────────────────
    run_workflow: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC6.1",
            controlName: "Logical access",
            evidenceType: "workflow_execution",
        },
        {
            framework: "SOC2",
            controlId: "SOC2_CC1.1",
            controlName: "Control environment",
            evidenceType: "workflow_execution",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.9",
            controlName: "Access control",
            evidenceType: "workflow_execution",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_ID",
            controlName: "Identify",
            evidenceType: "workflow_execution",
        },
    ],
    // ── Role Management ──────────────────────────────────────────────────────────
    assign_role: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC6.1",
            controlName: "Logical access",
            evidenceType: "role_assignment",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.9",
            controlName: "Access control",
            evidenceType: "role_assignment",
        },
    ],
    remove_role: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC6.1",
            controlName: "Logical access",
            evidenceType: "role_removal",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.9",
            controlName: "Access control",
            evidenceType: "role_removal",
        },
    ],
    // ── Incident Management ──────────────────────────────────────────────────────
    create_incident: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC2.2",
            controlName: "Communication and information",
            evidenceType: "incident_created",
        },
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.16",
            controlName: "Incident management",
            evidenceType: "incident_created",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_RS",
            controlName: "Respond",
            evidenceType: "incident_created",
        },
    ],
    // ── Compliance Status Updates ────────────────────────────────────────────────
    update_compliance_status: [
        {
            framework: "SOC2",
            controlId: "SOC2_CC1.1",
            controlName: "Control environment",
            evidenceType: "compliance_status_update",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_ID",
            controlName: "Identify",
            evidenceType: "compliance_status_update",
        },
    ],
    // ── Directory Synchronization ────────────────────────────────────────────────
    sync_directory: [
        {
            framework: "ISO27001",
            controlId: "ISO27001_A.8",
            controlName: "Asset management",
            evidenceType: "directory_sync",
        },
        {
            framework: "NIST CSF",
            controlId: "NIST_ID",
            controlName: "Identify",
            evidenceType: "directory_sync",
        },
    ],
};
//# sourceMappingURL=compliance-mapping.js.map