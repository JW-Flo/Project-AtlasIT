import type { AuthRepository, TokenRecord, Session } from "../interfaces.js";
export declare class InMemoryAuthRepository implements AuthRepository {
  readonly tokens: Map<string, TokenRecord>;
  readonly sessions: Map<string, Session>;
  findToken(hash: string): Promise<TokenRecord | null>;
  storeToken(token: TokenRecord): Promise<void>;
  deleteToken(hash: string): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  putSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
  clear(): void;
}
//# sourceMappingURL=in-memory-auth-repository.d.ts.map
