import type { AuthContext } from "./types.js";
import { JwtVerifier } from "./jwt-verifier.js";
import type { AuthRepository } from "../data/interfaces.js";

export interface AuthMiddlewareConfig {
  jwtVerifier: JwtVerifier;
  authRepo?: AuthRepository;
  requiredRoles?: string[];
}

export type AuthenticatedHandler<TEvent = unknown, TResult = unknown> = (
  event: TEvent,
  context: AuthContext,
) => Promise<TResult>;

export async function authenticate(
  authorizationHeader: string | undefined,
  apiKeyHeader: string | undefined,
  config: AuthMiddlewareConfig,
): Promise<AuthContext> {
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
    const ctx: AuthContext = {
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

function enforceRoles(ctx: AuthContext, required?: string[]): void {
  if (!required?.length) return;
  for (const role of required) {
    if (!ctx.roles.includes(role)) {
      throw new AuthError(403, `Missing required role: ${role}`);
    }
  }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
