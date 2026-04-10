/**
 * AuthContext — the identity object placed in Hono's context store
 * by authMiddleware().
 *
 * This is the Hono/CF-Worker variant (roles: string[]).
 * The Lambda variant lives in ./lambda-auth.ts and uses role: string.
 */

export interface AuthContext {
  /** User or service identifier */
  userId: string;
  /** Tenant the request belongs to */
  tenantId: string;
  /** User email address (empty string for service accounts) */
  email: string;
  /**
   * List of roles held by the principal.
   * For hierarchical checks use requireRole() which compares against
   * ROLE_HIERARCHY = ["viewer", "member", "admin", "service"].
   */
  roles: string[];
  /** How the request was authenticated: "jwt" | "api-key" */
  tokenType?: string;
}
