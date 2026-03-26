import { authenticate, AuthError } from "./middleware.js";
import { JwtVerifier } from "./jwt-verifier.js";
let verifier = null;
function getVerifier() {
  if (verifier) return verifier;
  const issuerUrl = process.env.COGNITO_ISSUER_URL ?? "";
  const audience = process.env.COGNITO_CLIENT_ID ?? "";
  verifier = new JwtVerifier(issuerUrl, audience);
  return verifier;
}
export async function extractAuth(event, authRepo) {
  // API Gateway Cognito authorizer may have already validated;
  // check for authorizer claims first
  const authorizer = event.requestContext.authorizer;
  const jwtClaims = authorizer?.jwt;
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
//# sourceMappingURL=lambda-auth.js.map
