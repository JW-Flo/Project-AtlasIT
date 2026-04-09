/**
 * Auth repo for Lambda — session validation via DynamoDB,
 * API key validation via PostgreSQL.
 */

import type { DynamoSessionRepo, Session } from "../platform/aws/repos/session-repo.js";
import type { AuthContext } from "./lambda-auth.js";
import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
    });
  }
  return _pool;
}

export class LambdaAuthRepo {
  constructor(private readonly sessionRepo: DynamoSessionRepo) {}

  async validateSession(token: string): Promise<Session | null> {
    return this.sessionRepo.get(token);
  }

  async validateApiKey(apiKey: string): Promise<AuthContext | null> {
    const pool = getPool();
    // API keys stored as hashed values; compare hash
    const hash = await hashKey(apiKey);
    const result = await pool.query(
      `SELECT u.id as user_id, u.tenant_id, u.email, u.role
       FROM users u
       JOIN app_credentials ac ON ac.tenant_id = u.tenant_id
       WHERE ac.credentials LIKE $1 AND u.status = 'active'
       LIMIT 1`,
      [`%${hash.slice(0, 16)}%`],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      role: row.role,
    };
  }
}

async function hashKey(key: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(key).digest("hex");
}
