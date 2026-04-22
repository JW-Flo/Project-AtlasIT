const DEFAULT_SECURITY_POLICY = {
  mfaRequired: false,
  sessionTtlSeconds: 604800,
  // 7 days
  mfaSessionTtlSeconds: 604800,
  // 7 days
  maxSessionTtlSeconds: 2592e3,
  // 30 days
  idleTimeoutSeconds: 86400,
  // 24 hours
  passwordRotationDays: 0,
  minPasswordLength: 8,
  mfaRequiredRoles: ["owner", "admin"]
};
function resolveSecurityPolicy(stored) {
  if (!stored)
    return { ...DEFAULT_SECURITY_POLICY };
  return { ...DEFAULT_SECURITY_POLICY, ...stored };
}
function isMfaRequiredForUser(policy, userRoles) {
  if (policy.mfaRequired)
    return true;
  if (policy.mfaRequiredRoles.length === 0)
    return false;
  return userRoles.some((r) => policy.mfaRequiredRoles.includes(r));
}
function getSessionTtl(policy, mfaVerified) {
  return mfaVerified ? policy.mfaSessionTtlSeconds : policy.sessionTtlSeconds;
}

export { getSessionTtl as g, isMfaRequiredForUser as i, resolveSecurityPolicy as r };
//# sourceMappingURL=policies-DRfy6ccj.js.map
