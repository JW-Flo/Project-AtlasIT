import type { AuthContext } from "./types.js";
export declare class JwtVerifier {
  private readonly issuerUrl;
  private readonly audience;
  private readonly cacheTtlMs;
  private jwksCache;
  private jwksCacheExpiry;
  constructor(issuerUrl: string, audience: string, cacheTtlMs?: number);
  verify(token: string): Promise<AuthContext>;
  private getJwks;
}
//# sourceMappingURL=jwt-verifier.d.ts.map
