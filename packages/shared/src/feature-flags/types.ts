export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  tenantOverrides: Record<string, boolean>; // tenant_id → enabled
  tierMinimum?: "free" | "starter" | "professional" | "enterprise";
  killSwitch: boolean; // if true, flag is OFF regardless of other settings
  createdAt: string;
  updatedAt: string;
}

export interface FlagEvaluationContext {
  tenantId: string;
  tenantTier?: string;
  userId?: string;
}

export interface FlagEvaluationResult {
  key: string;
  enabled: boolean;
  reason:
    | "kill_switch"
    | "tenant_override"
    | "tier_minimum"
    | "rollout"
    | "default";
}
