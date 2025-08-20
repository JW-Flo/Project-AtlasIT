// Centralized error codes for onboarding domain
export const OnboardingErrors = {
  MISSING_FIELDS: (missing) => ({
    error: {
      code: "ONB-001",
      message: `Missing required fields: ${missing.join(", ")}`,
    },
  }),
  UNSUPPORTED_INDUSTRY: (allowed) => ({
    error: {
      code: "ONB-002",
      message: "Unsupported industry",
      details: allowed,
    },
  }),
  INVALID_CONFIG: (issues) => ({
    error: {
      code: "ONB-003",
      message: "Invalid configuration",
      details: issues,
    },
  }),
  ALREADY_PROVISIONED: (tenantId) => ({
    error: {
      code: "ONB-004",
      message: `Onboarding already completed for tenant ${tenantId}`,
    },
  }),
  TENANT_ID_REQUIRED: () => ({
    error: {
      code: "ONB-005",
      message: "Tenant ID required",
    },
  }),
  ONBOARDING_NOT_FOUND: () => ({
    error: {
      code: "ONB-006",
      message: "Onboarding not found",
    },
  }),
  UNKNOWN: () => ({
    error: { code: "ONB-999", message: "Unknown error" },
  }),
};
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
//# sourceMappingURL=errors.js.map
