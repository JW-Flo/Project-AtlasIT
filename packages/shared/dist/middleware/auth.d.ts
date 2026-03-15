import type { MiddlewareHandler } from "hono";
import type { AuthContext } from "../auth/types.js";
declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
    tenantId: string;
  }
}
interface AuthMiddlewareOptions {
  issuerUrl?: string;
  audience?: string;
  requiredRoles?: string[];
  allowApiKey?: boolean;
}
export declare function authMiddleware(
  options?: AuthMiddlewareOptions,
): MiddlewareHandler;
export declare function requireRoles(...roles: string[]): MiddlewareHandler;
export declare function tenantGuard(): MiddlewareHandler;
export {};
//# sourceMappingURL=auth.d.ts.map
