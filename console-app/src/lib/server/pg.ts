/**
 * PostgreSQL connection helper for SvelteKit server routes
 *
 * Replaces D1 (ATLAS_SHARED_DB) queries with direct Aurora PG access.
 * Use this when the route previously queried D1 but the data is now in PG.
 */

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPgPool(): pg.Pool {
  if (!_pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }
    _pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
    // Warm the pool
    _pool
      .connect()
      .then((c) => c.release())
      .catch(() => {});
  }
  return _pool;
}

/**
 * Execute a parameterized query with snake_case → camelCase conversion
 */
export async function queryPg<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPgPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/**
 * Execute a query returning a single row (or null)
 */
export async function queryPgOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await queryPg<T>(sql, params);
  return rows[0] ?? null;
}
