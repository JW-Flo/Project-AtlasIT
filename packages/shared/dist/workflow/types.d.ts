/**
 * Workflow run types and state schema.
 *
 * Schema version is embedded in every persisted run state to support
 * forward-compatible migrations. Hash computation uses canonical JSON
 * (sorted keys, no whitespace) via sha-256.
 */
/** Current schema version — bump on any breaking state shape change. */
export declare const WORKFLOW_STATE_SCHEMA_VERSION = 1;
/** Maximum retries before a step is routed to the DLQ. */
export declare const DEFAULT_MAX_RETRIES = 3;
/** Base delay in milliseconds for exponential backoff. */
export declare const BACKOFF_BASE_MS = 2000;
/** Maximum delay cap in milliseconds. */
export declare const BACKOFF_MAX_MS = 120000;
export type WorkflowType = "joiner" | "mover" | "leaver";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "dlq" | "skipped";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "compensating";
export interface StepDefinition {
    id: string;
    action: string;
    /** If true, a failure in this step is non-blocking. */
    optional?: boolean;
}
export interface StepState {
    stepId: string;
    action: string;
    status: StepStatus;
    attempts: number;
    startedAt?: string;
    completedAt?: string;
    output?: unknown;
    error?: string;
    durationMs?: number;
}
export interface HistoryEntry {
    stepId: string;
    action: string;
    status: string;
    timestamp: string;
    attemptNumber: number;
    output?: unknown;
    error?: string;
}
export interface DLQEntry {
    runId: string;
    stepId: string;
    action: string;
    attempts: number;
    lastError: string;
    payload: unknown;
    createdAt: string;
}
export interface RunState {
    /** Schema version for forward-compatible deserialization. */
    schemaVersion: number;
    id: string;
    type: WorkflowType;
    status: RunStatus;
    tenantId: string;
    userId: string;
    /** Actor identity for evidence attribution. */
    actor: string;
    createdAt: string;
    completedAt?: string;
    steps: StepState[];
    history: HistoryEntry[];
    context: Record<string, unknown>;
    /** Number of alarm wake-ups processed (diagnostic). */
    alarmCount: number;
}
export interface EvidenceArtifact {
    kind: string;
    uri: string;
    sha256: string;
}
export interface EvidencePolicy {
    bundleRevision: string;
    decisionId: string;
    query: string;
}
export interface EvidenceEnvelope {
    tenantId: string;
    workflowRunId: string;
    stepId: string;
    actor: string;
    eventType: string;
    createdAt: string;
    hash: string;
    outcome?: "success" | "failure" | "skipped";
    error?: string;
    durationMs?: number;
    artifacts?: EvidenceArtifact[];
    policy?: EvidencePolicy;
    metadata?: Record<string, unknown>;
}
export interface StepTaskMessage {
    kind: "step-task";
    runId: string;
    stepId: string;
    attempt: number;
}
export interface StepResultMessage {
    kind: "step-result";
    runId: string;
    stepId: string;
    attempt: number;
    success: boolean;
    output?: unknown;
    error?: string;
}
/**
 * Produce canonical JSON: sorted keys, no extra whitespace.
 * Used for deterministic hashing of state and evidence envelopes.
 */
export declare function canonicalJson(value: unknown): string;
/**
 * Compute SHA-256 hex digest of a string.
 * Works in both Workers (crypto.subtle) and Node (globalThis.crypto).
 */
export declare function sha256Hex(input: string): Promise<string>;
//# sourceMappingURL=types.d.ts.map