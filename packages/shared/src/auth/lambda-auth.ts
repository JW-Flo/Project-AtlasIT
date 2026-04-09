/**
 * Lambda auth — extracts tenant/user identity from API Gateway events.
 * Replaces CF Access JWT-based auth from the Workers implementation.
 *
 * Supports: Bearer token (session-based) and API key auth.
 */

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { LambdaAuthRepo } from "./lambda-auth-repo.js";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export async function extractAuth(
  event: APIGatewayProxyEventV2,
  authRepo: LambdaAuthRepo,
): Promise<AuthContext> {
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;

  if (!authHeader) {
    // Check x-tenant-id header (service-to-service calls)
    const tenantId = event.headers?.["x-tenant-id"];
    if (tenantId) {
      return {
        userId: "system",
        tenantId,
        email: "system@atlasit.pro",
        role: "admin",
      };
    }
    throw new AuthError("Missing authorization header");
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const session = await authRepo.validateSession(token);
    if (!session) throw new AuthError("Invalid or expired session");
    return {
      userId: session.userId,
      tenantId: session.tenantId,
      email: session.email,
      role: session.role,
    };
  }

  if (authHeader.startsWith("ApiKey ")) {
    const apiKey = authHeader.slice(7);
    const identity = await authRepo.validateApiKey(apiKey);
    if (!identity) throw new AuthError("Invalid API key");
    return identity;
  }

  throw new AuthError("Unsupported authorization scheme");
}
