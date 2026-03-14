/**
 * Workflow run types and state schema.
 *
 * Schema version is embedded in every persisted run state to support
 * forward-compatible migrations. Hash computation uses canonical JSON
 * (sorted keys, no whitespace) via sha-256.
 */

/** Current schema version — bump on any breaking state shape change. */
export const WORKFLOW_STATE_SCHEMA_VERSION = 1;

/** Maximum retries before a step is routed to the DLQ. */
export const DEFAULT_MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff. */
export const BACKOFF_BASE_MS = 2_000;

/** Maximum delay cap in milliseconds. */
export const BACKOFF_MAX_MS = 120_000;

// ---------------------------------------------------------------------------
// Workflow type discriminants
// ---------------------------------------------------------------------------

export type WorkflowType = "joiner" | "mover" | "leaver";

// ---------------------------------------------------------------------------
// Step status lifecycle
// ---------------------------------------------------------------------------

export type StepStatus = "pending" | "running" | "completed" | "failed" | "dlq" | "skipped";

// ---------------------------------------------------------------------------
// Run status lifecycle
// ---------------------------------------------------------------------------

export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "compensating";

// ---------------------------------------------------------------------------
// Step definition — the static template for a workflow type
// ---------------------------------------------------------------------------

export interface StepDefinition {
  id: string;
  action: string;
  /** If true, a failure in this step is non-blocking. */
  optional?: boolean;
}

// ---------------------------------------------------------------------------
// Step state — persisted per step within a run
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// History entry — append-only log of step transitions
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  stepId: string;
  action: string;
  status: string;
  timestamp: string;
  attemptNumber: number;
  output?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// DLQ entry — a failed step that exhausted retries
// ---------------------------------------------------------------------------

export interface DLQEntry {
  runId: string;
  stepId: string;
  action: string;
  attempts: number;
  lastError: string;
  payload: unknown;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Run state — the full persisted state of a workflow run
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Evidence envelope types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Queue message shapes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Canonical JSON helper for deterministic hashing
// ---------------------------------------------------------------------------

/**
 * Produce canonical JSON: sorted keys, no extra whitespace.
 * Used for deterministic hashing of state and evidence envelopes.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce(
          (sorted, k) => {
            sorted[k] = (val as Record<string, unknown>)[k];
            return sorted;
          },
          {} as Record<string, unknown>,
        );
    }
    return val;
  });
}

/**
 * Compute SHA-256 hex digest of a string.
 * Works in both Workers (crypto.subtle) and Node (globalThis.crypto).
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
