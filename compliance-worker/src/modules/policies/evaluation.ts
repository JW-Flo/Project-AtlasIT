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
  const payload = {
    tenantId: options.tenantId,
    policyKey: options.policyKey,
    input: options.input,
    evaluatedAt: new Date().toISOString(),
  };
  const { canonical } = await hashCanonicalJson(payload);
  const hash = await sha256Hex(canonical);
  return {
    result: payload,
    hash,
    canonical,
  };
}
