export interface OnboardingErrorShape {
  error: { code: string; message: string; details?: string[] };
}

// Centralized error codes for onboarding domain
export const OnboardingErrors = {
  MISSING_FIELDS: (missing: string[]): OnboardingErrorShape => ({
    error: {
      code: "ONB-001",
      message: `Missing required fields: ${missing.join(", ")}`,
    },
  }),
  UNSUPPORTED_INDUSTRY: (allowed: string[]): OnboardingErrorShape => ({
    error: {
      code: "ONB-002",
      message: "Unsupported industry",
      details: allowed,
    },
  }),
  INVALID_CONFIG: (issues: string[]): OnboardingErrorShape => ({
    error: {
      code: "ONB-003",
      message: "Invalid configuration",
      details: issues,
    },
  }),
  ALREADY_PROVISIONED: (tenantId: string): OnboardingErrorShape => ({
    error: {
      code: "ONB-004",
      message: `Onboarding already completed for tenant ${tenantId}`,
    },
  }),
  TENANT_ID_REQUIRED: (): OnboardingErrorShape => ({
    error: {
      code: "ONB-005",
      message: "Tenant ID required",
    },
  }),
  ONBOARDING_NOT_FOUND: (): OnboardingErrorShape => ({
    error: {
      code: "ONB-006",
      message: "Onboarding not found",
    },
  }),
  UNKNOWN: (): OnboardingErrorShape => ({
    error: { code: "ONB-999", message: "Unknown error" },
  }),
} as const;

export function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
