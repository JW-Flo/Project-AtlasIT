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
export interface ControlMapping {
    framework: string;
    controlId: string;
    controlName: string;
    evidenceType: string;
}
/**
 * ACTION_COMPLIANCE_MAP — action type → list of controls satisfied.
 *
 * Covers the 3 highest-value action types fully; remaining action types
 * carry partial mappings. Extend as framework coverage expands.
 *
 * TODO: import full map from packages/shared/src/automation/compliance-mapping.ts
 * once the CDT rules agent generates the complete 24-app version.
 */
export declare const ACTION_COMPLIANCE_MAP: Record<string, ControlMapping[]>;
//# sourceMappingURL=compliance-mapping.d.ts.map