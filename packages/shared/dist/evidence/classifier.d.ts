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
export type EvidenceImpact = "positive" | "detrimental" | "neutral";
export type EvidenceCategory = "access_grant" | "access_revoke" | "offboarding" | "onboarding" | "role_change" | "directory_sync" | "mfa_enforcement" | "incident_response" | "policy_change" | "config_change" | "access_review" | "compliance_check" | "workflow_execution" | "audit_log";
export interface ControlClassification {
    framework: string;
    controlId: string;
    controlName: string;
    impact: EvidenceImpact;
    confidence: number;
    category: EvidenceCategory;
    reasoning: string;
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
/**
 * Classify a tenant event against compliance controls.
 *
 * Returns null if the event is not tenant data (internal platform events)
 * or if no classification rules match.
 */
export declare function classifyEvent(tenantId: string, eventType: string, source: string, actor: string, subject: string | null, payload: Record<string, unknown>): ClassifiedEvidence | null;
/**
 * Get all unique frameworks affected by a classification.
 */
export declare function affectedFrameworks(evidence: ClassifiedEvidence): string[];
/**
 * Get controls with detrimental impact (compliance weakening events).
 */
export declare function detrimentalControls(evidence: ClassifiedEvidence): ControlClassification[];
/**
 * Get the highest confidence classification for a given control.
 */
export declare function bestClassification(evidence: ClassifiedEvidence, controlId: string): ControlClassification | undefined;
//# sourceMappingURL=classifier.d.ts.map