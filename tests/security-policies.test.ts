import { describe, it, expect } from "vitest";
import {
  resolveSecurityPolicy,
  isMfaRequiredForUser,
  getSessionTtl,
  DEFAULT_SECURITY_POLICY,
} from "@atlasit/shared/security/policies";

describe("Tenant Security Policies", () => {
  describe("resolveSecurityPolicy", () => {
    it("returns defaults when no stored policy", () => {
      expect(resolveSecurityPolicy(null)).toEqual(DEFAULT_SECURITY_POLICY);
      expect(resolveSecurityPolicy(undefined)).toEqual(DEFAULT_SECURITY_POLICY);
    });

    it("merges partial overrides with defaults", () => {
      const policy = resolveSecurityPolicy({ mfaRequired: true, sessionTtlSeconds: 3600 });
      expect(policy.mfaRequired).toBe(true);
      expect(policy.sessionTtlSeconds).toBe(3600);
      expect(policy.minPasswordLength).toBe(8); // default preserved
    });
  });

  describe("isMfaRequiredForUser", () => {
    it("returns true when mfaRequired is global", () => {
      const policy = resolveSecurityPolicy({ mfaRequired: true });
      expect(isMfaRequiredForUser(policy, ["member"])).toBe(true);
    });

    it("returns false with default policy for regular users", () => {
      const policy = resolveSecurityPolicy(null);
      expect(isMfaRequiredForUser(policy, ["member"])).toBe(false);
    });

    it("returns true for role-specific MFA requirement", () => {
      const policy = resolveSecurityPolicy({ mfaRequiredRoles: ["owner", "admin"] });
      expect(isMfaRequiredForUser(policy, ["admin"])).toBe(true);
      expect(isMfaRequiredForUser(policy, ["member"])).toBe(false);
      expect(isMfaRequiredForUser(policy, ["owner", "admin"])).toBe(true);
    });
  });

  describe("getSessionTtl", () => {
    it("returns standard TTL for non-MFA sessions", () => {
      const policy = resolveSecurityPolicy({
        sessionTtlSeconds: 3600,
        mfaSessionTtlSeconds: 86400,
      });
      expect(getSessionTtl(policy, false)).toBe(3600);
    });

    it("returns MFA TTL for MFA-verified sessions", () => {
      const policy = resolveSecurityPolicy({
        sessionTtlSeconds: 3600,
        mfaSessionTtlSeconds: 86400,
      });
      expect(getSessionTtl(policy, true)).toBe(86400);
    });

    it("uses defaults when not configured", () => {
      const policy = resolveSecurityPolicy(null);
      expect(getSessionTtl(policy, false)).toBe(604800);
      expect(getSessionTtl(policy, true)).toBe(604800);
    });
  });
});
