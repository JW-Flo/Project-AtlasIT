export type { AuthContext, JwtClaims } from "./types.js";
export { JwtVerifier } from "./jwt-verifier.js";
export { authenticate, AuthError } from "./middleware.js";
export type {
  AuthMiddlewareConfig,
  AuthenticatedHandler,
} from "./middleware.js";
