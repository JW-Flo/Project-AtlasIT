import type { AuthRepository, TokenRecord, Session } from "../interfaces.js";

export class InMemoryAuthRepository implements AuthRepository {
  readonly tokens = new Map<string, TokenRecord>();
  readonly sessions = new Map<string, Session>();

  async findToken(hash: string): Promise<TokenRecord | null> {
    return this.tokens.get(hash) ?? null;
  }

  async storeToken(token: TokenRecord): Promise<void> {
    this.tokens.set(token.hash, { ...token });
  }

  async deleteToken(hash: string): Promise<void> {
    this.tokens.delete(hash);
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async putSession(session: Session): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  clear(): void {
    this.tokens.clear();
    this.sessions.clear();
  }
}
