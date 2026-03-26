export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  tenantOverrides: Record<string, boolean>;
  tierMinimum?: "free" | "starter" | "professional" | "enterprise";
  killSwitch: boolean;
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
//# sourceMappingURL=types.d.ts.map
