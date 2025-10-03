interface CreateClaims {
  sub: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  iss?: string;
  aud?: string;
  exp?: number;
}
export declare function createJWT(
  claims: CreateClaims,
  secret: string,
): Promise<string>;
export declare function verifyJWT(
  token: string,
  secret: string,
): Promise<CreateClaims>;
export {};
//# sourceMappingURL=jwt.d.ts.map
