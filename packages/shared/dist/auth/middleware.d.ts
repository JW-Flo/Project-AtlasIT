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
export declare function authenticate(
  authorizationHeader: string | undefined,
  apiKeyHeader: string | undefined,
  config: AuthMiddlewareConfig,
): Promise<AuthContext>;
export declare class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string);
}
//# sourceMappingURL=middleware.d.ts.map
