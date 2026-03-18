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
export declare function authMiddleware(options?: AuthMiddlewareOptions): MiddlewareHandler;
export declare function requireRoles(...roles: string[]): MiddlewareHandler;
/**
 * Hierarchical role check middleware.
 * Role hierarchy: viewer < member < admin
 * A user with "admin" passes a check for "member" or "viewer".
 */
declare const ROLE_HIERARCHY: readonly ["viewer", "member", "admin"];
export type RoleLevel = (typeof ROLE_HIERARCHY)[number];
export declare function requireRole(role: RoleLevel): MiddlewareHandler;
export declare function tenantGuard(): MiddlewareHandler;
export {};
//# sourceMappingURL=auth.d.ts.map