/**
 * Adapter evidence collector — pulls compliance-relevant configuration
 * from connected adapters to generate evidence artifacts.
 *
 * Each adapter exposes a `/api/evidence` endpoint that returns
 * configuration state relevant to compliance controls.
 */
export interface AdapterEvidenceConfig {
    slug: string;
    evidenceTypes: AdapterEvidenceType[];
}
export interface AdapterEvidenceType {
    type: string;
    controlRefs: string[];
    description: string;
}
export interface AdapterEvidenceResult {
    slug: string;
    collectedAt: string;
    items: AdapterEvidenceItem[];
}
export interface AdapterEvidenceItem {
    type: string;
    controlRefs: string[];
    status: "pass" | "fail" | "unknown";
    details: Record<string, unknown>;
}
/**
 * Registry of adapter evidence collection capabilities.
 * Maps adapter slug → evidence types with compliance control references.
 */
export declare const ADAPTER_EVIDENCE_REGISTRY: AdapterEvidenceConfig[];
/**
 * Collect evidence from a single adapter by calling its /api/evidence endpoint.
 */
export declare function collectAdapterEvidence(adapterUrl: string, slug: string, tenantId: string): Promise<AdapterEvidenceResult>;
/**
 * Collect evidence from all configured adapters for a tenant.
 */
export declare function collectAllAdapterEvidence(adapterUrls: Record<string, string>, tenantId: string): Promise<AdapterEvidenceResult[]>;
export declare function parseControlRef(ref: string): {
    framework: string;
    controlId: string;
};
//# sourceMappingURL=adapter-collector.d.ts.map