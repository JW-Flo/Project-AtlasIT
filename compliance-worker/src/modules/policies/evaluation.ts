import { hashCanonicalJson, sha256Hex } from "../../../../src/lib/canonical-json";
import {
  runControlEval,
  ALL_CONTROL_IDS,
} from "../../../../shared/services/cdt/src/evaluation/engine";
import type { CdtEvent } from "../../../../shared/services/cdt/src/models";
import { ALL_CONTROLS } from "./cdt-rules";

export type Framework = "soc2" | "iso27001" | "hipaa" | "nist_csf" | "gdpr";

export const FRAMEWORK_CONTROLS: Record<Framework, string[]> = {
  soc2: ALL_CONTROL_IDS.filter((id) => id.startsWith("SOC2-")),
  iso27001: ALL_CONTROL_IDS.filter((id) => id.startsWith("ISO-27001-")),
  hipaa: ALL_CONTROL_IDS.filter((id) => id.startsWith("HIPAA-")),
  nist_csf: ALL_CONTROL_IDS.filter((id) => id.startsWith("NIST-CSF-")),
  gdpr: ALL_CONTROL_IDS.filter((id) => id.startsWith("GDPR-")),
};

export interface PolicyEvaluationOptions {
  tenantId: string;
  policyKey: string;
  input: Record<string, unknown>;
  /** Optional event type; defaults to "policy.evaluation" */
  eventType?: string;
  /** Optional trace ID; generated if omitted */
  traceId?: string;
}

export interface PolicyEvaluationResult {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
  evaluatedAt: string;
  controlId: string;
  result: Record<string, unknown>;
  hash: string;
  canonical: string;
}

export interface ControlEvalResult {
  controlId: string;
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
}

export interface FrameworkSummary {
  framework: Framework;
  total: number;
  passed: number;
  failed: number;
  unknown: number;
  score: number;
  controls: ControlEvalResult[];
}

function buildCdtEvent(
  tenantId: string,
  input: Record<string, unknown>,
  eventType: string,
  traceId: string,
): CdtEvent {
  return {
    type: eventType,
    tenant: tenantId,
    occurred_at: new Date().toISOString(),
    payload: input,
    trace_id: traceId,
  };
}

export async function evaluatePolicy(
  options: PolicyEvaluationOptions,
): Promise<PolicyEvaluationResult> {
  const eventType = options.eventType ?? "policy.evaluation";
  const traceId = options.traceId ?? crypto.randomUUID();
  const evaluatedAt = new Date().toISOString();

  const ev = buildCdtEvent(options.tenantId, options.input, eventType, traceId);
  const { decision, rationale, references } = runControlEval(options.policyKey, ev);

  const stableContext = {
    tenantId: options.tenantId,
    policyKey: options.policyKey,
    input: options.input,
  };
  const { canonical } = await hashCanonicalJson(stableContext);
  const hash = await sha256Hex(canonical);

  const result: Record<string, unknown> = {
    ...stableContext,
    decision,
    rationale,
    references,
    evaluatedAt,
  };

  return {
    decision,
    rationale,
    references,
    evaluatedAt,
    controlId: options.policyKey,
    result,
    hash,
    canonical,
  };
}

export async function evaluateAllControls(
  tenantId: string,
  input: Record<string, unknown>,
  options?: { eventType?: string; traceId?: string },
): Promise<ControlEvalResult[]> {
  const eventType = options?.eventType ?? "policy.evaluation";
  const traceId = options?.traceId ?? crypto.randomUUID();
  const ev = buildCdtEvent(tenantId, input, eventType, traceId);

  return ALL_CONTROL_IDS.map((controlId) => {
    const { decision, rationale, references } = runControlEval(controlId, ev);
    return { controlId, decision, rationale, references };
  });
}

export async function evaluateFramework(
  framework: Framework,
  tenantId: string,
  input: Record<string, unknown>,
  options?: { eventType?: string; traceId?: string },
): Promise<FrameworkSummary> {
  const controlIds = FRAMEWORK_CONTROLS[framework];
  if (!controlIds) {
    throw new Error(`Unknown framework: ${framework}`);
  }

  const eventType = options?.eventType ?? "policy.evaluation";
  const traceId = options?.traceId ?? crypto.randomUUID();
  const ev = buildCdtEvent(tenantId, input, eventType, traceId);

  const controls: ControlEvalResult[] = controlIds.map((controlId) => {
    const { decision, rationale, references } = runControlEval(controlId, ev);
    return { controlId, decision, rationale, references };
  });

  const passed = controls.filter((c) => c.decision === "pass").length;
  const failed = controls.filter((c) => c.decision === "fail").length;
  const unknown = controls.filter((c) => c.decision === "unknown").length;
  const total = controls.length;
  const score = total > 0 ? passed / total : 0;

  return { framework, total, passed, failed, unknown, score, controls };
}

/**
 * Derive the framework prefix and short control ID from a full CDT control ID.
 * e.g. "SOC2-CC6.1" → { framework: "SOC2", controlId: "CC6.1" }
 *      "ISO-27001-A.9.2.3" → { framework: "ISO27001", controlId: "A.9.2.3" }
 */
function parseFullControlId(fullId: string): { framework: string; controlId: string } {
  if (fullId.startsWith("SOC2-")) return { framework: "SOC2", controlId: fullId.slice(5) };
  if (fullId.startsWith("ISO-27001-"))
    return { framework: "ISO27001", controlId: fullId.slice(10) };
  if (fullId.startsWith("HIPAA-")) return { framework: "HIPAA", controlId: fullId.slice(6) };
  if (fullId.startsWith("NIST-CSF-")) return { framework: "NIST_CSF", controlId: fullId.slice(9) };
  if (fullId.startsWith("GDPR-")) return { framework: "GDPR", controlId: fullId.slice(5) };
  return { framework: "UNKNOWN", controlId: fullId };
}

export interface BulkEvalResult {
  passed: number;
  failed: number;
  unknown: number;
}

/**
 * Evaluate all 60 CDT controls and store results as compliance_evidence
 * with evidence_type = 'policy_evaluation'. Uses deterministic IDs so
 * repeated evaluations replace previous results rather than growing unbounded.
 */
export async function evaluateAndStoreEvidence(
  db: D1Database,
  tenantId: string,
  input: Record<string, unknown>,
): Promise<BulkEvalResult> {
  const traceId = crypto.randomUUID();
  const ev = buildCdtEvent(tenantId, input, "policy.evaluation", traceId);
  const now = new Date().toISOString();

  let passed = 0;
  let failed = 0;
  let unknown = 0;

  const stmts: D1PreparedStatement[] = [];

  for (const fullControlId of ALL_CONTROL_IDS) {
    const { decision, rationale } = runControlEval(fullControlId, ev);
    const { framework, controlId } = parseFullControlId(fullControlId);

    if (decision === "pass") passed++;
    else if (decision === "fail") failed++;
    else unknown++;

    // Find control name from ALL_CONTROLS (short ID match)
    const controlDef = ALL_CONTROLS.find((c) => c.controlId === controlId);
    const controlName = controlDef?.controlName ?? fullControlId;

    // Deterministic ID prevents unbounded row growth
    const id = `policy-eval-${tenantId}-${controlId}`;
    const metadata = JSON.stringify({ status: decision, rationale });
    const sourceId = `policy-eval:${controlId}`;

    stmts.push(
      db
        .prepare(
          `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             metadata = excluded.metadata,
             created_at = excluded.created_at`,
        )
        .bind(
          id,
          tenantId,
          framework,
          controlId,
          controlName,
          "policy_evaluation",
          "policy",
          sourceId,
          "system",
          "cdt-evaluation",
          metadata,
          now,
        ),
    );
  }

  // Batch execute all INSERT/UPDATE statements
  await db.batch(stmts);

  return { passed, failed, unknown };
}
