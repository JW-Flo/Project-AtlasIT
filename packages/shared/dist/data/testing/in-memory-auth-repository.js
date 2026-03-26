export class InMemoryAuthRepository {
  tokens = new Map();
  sessions = new Map();
  async findToken(hash) {
    return this.tokens.get(hash) ?? null;
  }
  async storeToken(token) {
    this.tokens.set(token.hash, { ...token });
  }
  async deleteToken(hash) {
    this.tokens.delete(hash);
  }
  async getSession(id) {
    return this.sessions.get(id) ?? null;
  }
  async putSession(session) {
    this.sessions.set(session.id, { ...session });
  }
  async deleteSession(id) {
    this.sessions.delete(id);
  }
  clear() {
    this.tokens.clear();
    this.sessions.clear();
  }
}
//# sourceMappingURL=in-memory-auth-repository.js.map
