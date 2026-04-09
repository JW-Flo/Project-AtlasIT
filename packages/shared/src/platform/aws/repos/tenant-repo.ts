/**
 * PostgreSQL-backed tenant repo — replaces D1 tenants/users queries.
 */

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return _pool;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  status: string;
  tier: string;
  config?: Record<string, unknown>;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
}

export class PgTenantRepo {
  async getById(tenantId: string): Promise<Tenant | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, slug, industry, status, tier, config, created_at as "createdAt"
       FROM tenants WHERE id = $1`,
      [tenantId],
    );
    return result.rows[0] ?? null;
  }

  async getBySlug(slug: string): Promise<Tenant | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, slug, industry, status, tier, config, created_at as "createdAt"
       FROM tenants WHERE slug = $1`,
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async getUserByEmail(tenantId: string, email: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", email, display_name as "displayName", role, status
       FROM users WHERE tenant_id = $1 AND email = $2`,
      [tenantId, email],
    );
    return result.rows[0] ?? null;
  }

  async listUsers(tenantId: string): Promise<User[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", email, display_name as "displayName", role, status
       FROM users WHERE tenant_id = $1 ORDER BY email`,
      [tenantId],
    );
    return result.rows;
  }
}
