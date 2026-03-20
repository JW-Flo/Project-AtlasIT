import { hashCanonicalJson, sha256Hex } from "../../../../src/lib/canonical-json";
import { runControlEval, ALL_CONTROL_IDS } from "../../../../shared/services/cdt/src/evaluation/engine";
import type { CdtEvent } from "../../../../shared/services/cdt/src/models";

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

  return { decision, rationale, references, evaluatedAt, controlId: options.policyKey, result, hash, canonical };
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
