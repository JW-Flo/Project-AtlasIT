/**
 * Core authentication context shared across Lambda and middleware layers.
 */
export interface AuthContext {
  tenantId: string;
  userId: string;
  email: string;
  roles: string[];
  tokenType: "jwt" | "api-key";
}
