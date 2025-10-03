import {
  hashCanonicalJson,
  sha256Hex,
} from "../../../../src/lib/canonical-json";

export interface PolicyEvaluationOptions {
  tenantId: string;
  policyKey: string;
  input: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  result: Record<string, unknown>;
  hash: string;
  canonical: string;
}

export async function evaluatePolicy(
  options: PolicyEvaluationOptions,
): Promise<PolicyEvaluationResult> {
  const stableContext = {
    tenantId: options.tenantId,
    policyKey: options.policyKey,
    input: options.input,
  };
  const { canonical } = await hashCanonicalJson(stableContext);
  const hash = await sha256Hex(canonical);
  const result = { ...stableContext, evaluatedAt: new Date().toISOString() };
  return { result, hash, canonical };
}
