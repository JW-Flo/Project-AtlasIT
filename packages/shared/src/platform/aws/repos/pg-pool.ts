/**
 * Shared PostgreSQL connection pool — singleton across Lambda warm invocations.
 * Replaces the duplicate getPool() pattern in each Lambda's routes.ts.
 *
 * Usage:
 *   import { getPool } from "@atlasit/shared/platform/aws/repos/pg-pool.js";
 *   const pool = getPool();
 *   const result = await pool.query("SELECT ...", [...]);
 */

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
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
