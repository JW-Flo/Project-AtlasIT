import { JwtVerifier } from "../auth/jwt-verifier.js";
import { AuthError } from "../auth/middleware.js";
export function authMiddleware(options = {}) {
    let verifier = null;
    return async (c, next) => {
        const authHeader = c.req.header("Authorization");
        const apiKeyHeader = c.req.header("X-API-Key");
        // JWT auth
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const issuerUrl = options.issuerUrl ?? c.env?.JWT_ISSUER;
            const audience = options.audience ?? c.env?.JWT_AUDIENCE;
            if (!issuerUrl || !audience) {
                throw new AuthError(500, "JWT issuer or audience not configured");
            }
            if (!verifier) {
                verifier = new JwtVerifier(issuerUrl, audience);
            }
            const authContext = await verifier.verify(token);
            if (options.requiredRoles?.length) {
                for (const role of options.requiredRoles) {
                    if (!authContext.roles.includes(role)) {
                        throw new AuthError(403, `Missing required role: ${role}`);
                    }
                }
            }
            c.set("auth", authContext);
            c.set("tenantId", authContext.tenantId);
            await next();
            return;
        }
        // API key auth (legacy support)
        if (apiKeyHeader && options.allowApiKey !== false) {
            const allowedKeys = (c.env?.API_ALLOWED_KEYS ?? "")
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean);
            if (allowedKeys.length > 0 && allowedKeys.includes(apiKeyHeader)) {
                const tenantId = c.req.header("X-Tenant-ID") ?? "default";
                const authContext = {
                    tenantId,
                    userId: "",
                    email: "",
                    roles: ["api-key"],
                    tokenType: "api-key",
                };
                c.set("auth", authContext);
                c.set("tenantId", tenantId);
                await next();
                return;
            }
        }
        throw new AuthError(401, "Missing or invalid authentication");
    };
}
export function requireRoles(...roles) {
    return async (c, next) => {
        const auth = c.get("auth");
        if (!auth) {
            throw new AuthError(401, "Not authenticated");
        }
        for (const role of roles) {
            if (!auth.roles.includes(role)) {
                throw new AuthError(403, `Missing required role: ${role}`);
            }
        }
        await next();
    };
}
/**
 * Hierarchical role check middleware.
 * Role hierarchy: viewer < member < admin
 * A user with "admin" passes a check for "member" or "viewer".
 */
const ROLE_HIERARCHY = ["viewer", "member", "admin"];
export function requireRole(role) {
    return async (c, next) => {
        const auth = c.get("auth");
        if (!auth) {
            throw new AuthError(401, "Not authenticated");
        }
        const requiredLevel = ROLE_HIERARCHY.indexOf(role);
        const userLevel = Math.max(...auth.roles.map((r) => ROLE_HIERARCHY.indexOf(r)), -1);
        if (userLevel < requiredLevel) {
            throw new AuthError(403, `Insufficient role: requires ${role}`);
        }
        await next();
    };
}
export function tenantGuard() {
    return async (c, next) => {
        const auth = c.get("auth");
        if (!auth) {
            throw new AuthError(401, "Not authenticated");
        }
        const paramTenantId = c.req.param("tenantId");
        if (paramTenantId && paramTenantId !== auth.tenantId) {
            throw new AuthError(403, "Tenant ID mismatch");
        }
        await next();
    };
}
//# sourceMappingURL=auth.js.map