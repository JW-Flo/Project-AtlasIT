import type {
  FeatureFlag,
  FlagEvaluationContext,
  FlagEvaluationResult,
} from "./types.js";

const TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

function deterministicHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash) % 100;
}

export function evaluateFlag(
  flag: FeatureFlag,
  context: FlagEvaluationContext,
): FlagEvaluationResult {
  if (flag.killSwitch) {
    return { key: flag.key, enabled: false, reason: "kill_switch" };
  }

  if (context.tenantId in flag.tenantOverrides) {
    return {
      key: flag.key,
      enabled: flag.tenantOverrides[context.tenantId],
      reason: "tenant_override",
    };
  }

  if (flag.tierMinimum && context.tenantTier) {
    const requiredLevel = TIER_ORDER[flag.tierMinimum] ?? 0;
    const tenantLevel = TIER_ORDER[context.tenantTier] ?? 0;
    if (tenantLevel < requiredLevel) {
      return { key: flag.key, enabled: false, reason: "tier_minimum" };
    }
  }

  if (flag.rolloutPercentage < 100) {
    const hash = deterministicHash(`${context.tenantId}:${flag.key}`);
    const enabled = hash < flag.rolloutPercentage;
    return { key: flag.key, enabled, reason: "rollout" };
  }

  return { key: flag.key, enabled: flag.enabled, reason: "default" };
}
