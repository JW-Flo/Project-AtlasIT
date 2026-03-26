import type { AuthContext } from "./types.js";
import { authenticate, AuthError } from "./middleware.js";
import { JwtVerifier } from "./jwt-verifier.js";
import type { AuthRepository } from "../data/interfaces.js";

interface LambdaEvent {
  headers?: Record<string, string | undefined>;
  requestContext: Record<string, unknown>;
}

let verifier: JwtVerifier | null = null;

function getVerifier(): JwtVerifier {
  if (verifier) return verifier;
  const issuerUrl = process.env.COGNITO_ISSUER_URL ?? "";
  const audience = process.env.COGNITO_CLIENT_ID ?? "";
  verifier = new JwtVerifier(issuerUrl, audience);
  return verifier;
}

export async function extractAuth(
  event: LambdaEvent,
  authRepo?: AuthRepository,
): Promise<AuthContext> {
  // API Gateway Cognito authorizer may have already validated;
  // check for authorizer claims first
  const authorizer = event.requestContext.authorizer as
    | Record<string, unknown>
    | undefined;
  const jwtClaims = authorizer?.jwt as
    | { claims: Record<string, string> }
    | undefined;

  if (jwtClaims?.claims) {
    const claims = jwtClaims.claims;
    const roles = claims["custom:roles"]
      ? claims["custom:roles"].split(",").map((r) => r.trim())
      : [];
    return {
      tenantId: claims["custom:tenant_id"] ?? "",
      userId: claims.sub ?? "",
      email: claims.email ?? "",
      roles,
      tokenType: "jwt",
    };
  }

  // Fall back to manual token verification
  const authorization = event.headers?.authorization;
  const apiKey = event.headers?.["x-api-key"];

  return authenticate(authorization, apiKey, {
    jwtVerifier: getVerifier(),
    authRepo,
  });
}

export { AuthError };
