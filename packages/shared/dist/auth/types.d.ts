export interface AuthContext {
  tenantId: string;
  userId: string;
  email: string;
  roles: string[];
  tokenType: "jwt" | "api-key";
}
export interface JwtClaims {
  sub: string;
  email: string;
  "custom:tenant_id": string;
  "custom:roles": string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: "id" | "access";
}
//# sourceMappingURL=types.d.ts.map
