/**
 * Tenant security policies — configurable by tenant owners.
 * Stored as JSON in tenant_preferences with key "security_policy".
 */

export interface TenantSecurityPolicy {
  /** Require MFA for all users in the tenant. Default: false */
  mfaRequired: boolean;

  /** Session duration in seconds. Default: 604800 (7 days) */
  sessionTtlSeconds: number;

  /** Session duration for MFA-verified sessions in seconds. Default: same as sessionTtlSeconds */
  mfaSessionTtlSeconds: number;

  /** Maximum session duration before forced re-authentication (absolute timeout). Default: 2592000 (30 days) */
  maxSessionTtlSeconds: number;

  /** Idle timeout in seconds (time since last activity). Default: 86400 (24 hours) */
  idleTimeoutSeconds: number;

  /** Require password change every N days. 0 = disabled. Default: 0 */
  passwordRotationDays: number;

  /** Minimum password length. Default: 8 */
  minPasswordLength: number;

  /** Block login from specific roles without MFA. Default: ["owner", "admin"] */
  mfaRequiredRoles: string[];
}

export const DEFAULT_SECURITY_POLICY: TenantSecurityPolicy = {
  mfaRequired: false,
  sessionTtlSeconds: 604800, // 7 days
  mfaSessionTtlSeconds: 604800, // 7 days
  maxSessionTtlSeconds: 2592000, // 30 days
  idleTimeoutSeconds: 86400, // 24 hours
  passwordRotationDays: 0,
  minPasswordLength: 8,
  mfaRequiredRoles: ["owner", "admin"],
};

/** Merge stored policy with defaults (partial updates are safe). */
export function resolveSecurityPolicy(
  stored: Partial<TenantSecurityPolicy> | null | undefined,
): TenantSecurityPolicy {
  if (!stored) return { ...DEFAULT_SECURITY_POLICY };
  return { ...DEFAULT_SECURITY_POLICY, ...stored };
}

/** Check if a user with given roles is required to use MFA. */
export function isMfaRequiredForUser(policy: TenantSecurityPolicy, userRoles: string[]): boolean {
  if (policy.mfaRequired) return true;
  if (policy.mfaRequiredRoles.length === 0) return false;
  return userRoles.some((r) => policy.mfaRequiredRoles.includes(r));
}

/** Get the appropriate session TTL based on whether MFA was verified. */
export function getSessionTtl(policy: TenantSecurityPolicy, mfaVerified: boolean): number {
  return mfaVerified ? policy.mfaSessionTtlSeconds : policy.sessionTtlSeconds;
}
