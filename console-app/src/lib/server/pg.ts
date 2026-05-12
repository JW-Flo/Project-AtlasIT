import { Pool } from "@neondatabase/serverless";

let _pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!_pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL not configured");
    _pool = new Pool({ connectionString: dbUrl });
  }
  return _pool;
}

export async function queryPg<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPgPool();
  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "PG query failed",
        sql: sql.substring(0, 200),
        paramCount: params.length,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    throw err;
  }
}

export async function queryPgOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryPg<T>(sql, params);
  return rows[0] ?? null;
}
