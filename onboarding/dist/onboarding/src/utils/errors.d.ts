export interface OnboardingErrorShape {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}
export declare const OnboardingErrors: {
  readonly MISSING_FIELDS: (missing: string[]) => OnboardingErrorShape;
  readonly UNSUPPORTED_INDUSTRY: (allowed: string[]) => OnboardingErrorShape;
  readonly INVALID_CONFIG: (issues: string[]) => OnboardingErrorShape;
  readonly ALREADY_PROVISIONED: (tenantId: string) => OnboardingErrorShape;
  readonly TENANT_ID_REQUIRED: () => OnboardingErrorShape;
  readonly ONBOARDING_NOT_FOUND: () => OnboardingErrorShape;
  readonly UNKNOWN: () => OnboardingErrorShape;
};
export declare function json(data: any, status?: number): Response;
//# sourceMappingURL=errors.d.ts.map
