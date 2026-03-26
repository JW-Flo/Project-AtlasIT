export interface AdapterManifest {
    name: string;
    version: string;
    capabilities: string[];
    auth: {
        type: string;
        scopes?: string[];
    };
    rateLimits?: {
        rpm: number;
    };
}
export interface AdapterResult {
    success: boolean;
    externalId?: string;
    error?: string;
    retryable?: boolean;
}
export interface AdapterHealthCheck {
    healthy: boolean;
    latencyMs: number;
    checkedAt: string;
}
//# sourceMappingURL=contract.d.ts.map