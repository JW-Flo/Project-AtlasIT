export async function authenticate(authorizationHeader, apiKeyHeader, config) {
  // Try JWT first
  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7);
    const ctx = await config.jwtVerifier.verify(token);
    enforceRoles(ctx, config.requiredRoles);
    return ctx;
  }
  // Fall back to API key (legacy, transition period)
  if (apiKeyHeader && config.authRepo) {
    const hash = await sha256Hex(apiKeyHeader);
    const tokenRecord = await config.authRepo.findToken(hash);
    if (!tokenRecord) throw new AuthError(401, "Invalid API key");
    const ctx = {
      tenantId: tokenRecord.tenantId,
      userId: "",
      email: "",
      roles: tokenRecord.roles,
      tokenType: "api-key",
    };
    enforceRoles(ctx, config.requiredRoles);
    return ctx;
  }
  throw new AuthError(401, "Missing authentication");
}
function enforceRoles(ctx, required) {
  if (!required?.length) return;
  for (const role of required) {
    if (!ctx.roles.includes(role)) {
      throw new AuthError(403, `Missing required role: ${role}`);
    }
  }
}
async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export class AuthError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}
//# sourceMappingURL=middleware.js.map
