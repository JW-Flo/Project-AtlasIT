import { generateRandomString } from "@atlasit/edge-utils";
import type { SessionData, AuthUser } from "./types";

interface StoreEnv {
  SESSION?: KVNamespace;
  D1_DB?: any; // Cloudflare D1 Database binding type placeholder
}

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface CreateSessionOpts {
  ttlSeconds?: number;
  ip?: string;
  ua?: string;
}

const ABSOLUTE_DEFAULT_SECONDS = 60 * 60 * 8; // 8h
const IDLE_DEFAULT_SECONDS = 60 * 30; // 30m
const KV_PREFIX = "sess:";

export function createSessionStore(env: StoreEnv) {
  class KVMock {
    private readonly map = new Map<string, { v: string; exp?: number }>();
    async put(
      key: string,
      value: string,
      options?: { expirationTtl?: number },
    ) {
      const exp = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : undefined;
      this.map.set(key, { v: value, exp });
    }
    async get(key: string) {
      const e = this.map.get(key);
      if (!e) return null;
      if (e.exp && e.exp < Date.now()) {
        this.map.delete(key);
        return null;
      }
      return e.v;
    }
    async delete(key: string) {
      this.map.delete(key);
    }
  }
  class D1Mock {
    sessions = new Map<string, any>();
    prepare(sql: string) {
      const sessions = this.sessions;
      return {
        _sql: sql,
        _binds: [] as any[],
        bind(...args: any[]) {
          this._binds = args;
          return this;
        },
        async run() {
          if (/INSERT INTO sessions/i.test(sql)) {
            const [
              id,
              user_id,
              email,
              tenant_id,
              refresh_hash,
              ,
              expires_at,
              ip,
              ua,
            ] = this._binds;
            sessions.set(id, {
              id,
              user_id,
              email,
              tenant_id,
              refresh_token_hash: refresh_hash,
              created_at: new Date().toISOString(),
              expires_at: new Date(expires_at).toISOString(),
              revoked_at: null,
              ip,
              user_agent: ua,
            });
          } else if (/UPDATE sessions SET refresh_token_hash/i.test(sql)) {
            const [hash, id] = this._binds;
            const s = sessions.get(id);
            if (s) s.refresh_token_hash = hash;
          } else if (/UPDATE sessions SET revoked_at/i.test(sql)) {
            const [id] = this._binds;
            const s = sessions.get(id);
            if (s) s.revoked_at = new Date().toISOString();
          }
          return { success: true } as any;
        },
        async first() {
          const [id] = this._binds;
          return sessions.get(id) || null;
        },
      } as any;
    }
  }

  const g: any = globalThis as any;
  if (!env.SESSION) g.__authKV = g.__authKV || new KVMock();
  if (!env.D1_DB) g.__authD1 = g.__authD1 || new D1Mock();
  const kv = env.SESSION ?? g.__authKV;
  const db = env.D1_DB ?? g.__authD1;

  async function cachePut(session: SessionData, ttlSeconds: number) {
    await kv.put(KV_PREFIX + session.id, JSON.stringify(session), {
      expirationTtl: ttlSeconds,
    });
  }
  async function cacheGet(id: string): Promise<SessionData | null> {
    const raw = await kv.get(KV_PREFIX + id);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      return null;
    }
  }

  return {
    async create(user: AuthUser, opts: CreateSessionOpts = {}) {
      const id = generateRandomString(32);
      const refreshRaw = generateRandomString(48);
      const refreshHash = await sha256(refreshRaw);
      const now = Date.now();
      const absoluteTtl = opts.ttlSeconds ?? ABSOLUTE_DEFAULT_SECONDS;
      const expires = now + absoluteTtl * 1000;
      await db
        .prepare(
          `INSERT INTO sessions (id, user_id, email, tenant_id, refresh_token_hash, created_at, expires_at, ip, user_agent)
        VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime(?6/1000, 'unixepoch'), ?7, ?8)`,
        )
        .bind(
          id,
          user.id,
          user.email ?? null,
          user.tenantId ?? null,
          refreshHash,
          expires,
          opts.ip ?? null,
          opts.ua ?? null,
        )
        .run();
      const record: SessionData = {
        id,
        user,
        issuedAt: now,
        expiresAt: expires,
        revokedAt: null,
        ip: opts.ip,
        userAgent: opts.ua,
      };
      const initialTtl = Math.min(
        IDLE_DEFAULT_SECONDS,
        Math.floor((expires - now) / 1000),
      );
      await cachePut(record, initialTtl);
      return { id, refreshToken: refreshRaw, session: record };
    },
    async get(id: string): Promise<SessionData | null> {
      const cached = await cacheGet(id);
      if (cached) {
        const remaining = Math.max(
          1,
          Math.floor((cached.expiresAt - Date.now()) / 1000),
        );
        await cachePut(cached, Math.min(IDLE_DEFAULT_SECONDS, remaining));
        return cached;
      }
      const row = await db
        .prepare(
          `SELECT id,user_id,email,tenant_id,refresh_token_hash,created_at,expires_at,revoked_at,ip,user_agent FROM sessions WHERE id = ?1`,
        )
        .bind(id)
        .first();
      if (!row) return null;
      const session: SessionData = {
        id: row.id,
        user: { id: row.user_id, email: row.email, tenantId: row.tenant_id },
        issuedAt: new Date(row.created_at).getTime(),
        expiresAt: new Date(row.expires_at).getTime(),
        revokedAt: row.revoked_at ? new Date(row.revoked_at).getTime() : null,
        ip: row.ip,
        userAgent: row.user_agent,
      };
      const remaining = Math.max(
        1,
        Math.floor((session.expiresAt - Date.now()) / 1000),
      );
      await cachePut(session, Math.min(IDLE_DEFAULT_SECONDS, remaining));
      return session;
    },
    isActive(session: SessionData | null): boolean {
      if (!session) return false;
      if (session.revokedAt) return false;
      return Date.now() < session.expiresAt;
    },
    async revoke(id: string): Promise<boolean> {
      const row = await db
        .prepare(`SELECT id FROM sessions WHERE id = ?1`)
        .bind(id)
        .first();
      if (!row) return false;
      await db
        .prepare(
          `UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?1`,
        )
        .bind(id)
        .run();
      await kv.delete(KV_PREFIX + id);
      return true;
    },
    async rotateRefreshToken(
      id: string,
    ): Promise<{ refreshToken: string } | null> {
      const row = await db
        .prepare(`SELECT id FROM sessions WHERE id = ?1`)
        .bind(id)
        .first();
      if (!row) return null;
      const newRaw = generateRandomString(48);
      const newHash = await sha256(newRaw);
      await db
        .prepare(`UPDATE sessions SET refresh_token_hash = ?1 WHERE id = ?2`)
        .bind(newHash, id)
        .run();
      // Invalidate cached session so next get() rehydrates from DB
      await kv.delete(KV_PREFIX + id);
      return { refreshToken: newRaw };
    },
  };
}
