/**
 * Migration runner. Supports two shapes:
 *   {"statements": ["SELECT 1", ...]}
 *   {"statements": [{"sql": "INSERT ...", "params": [...]}, ...]}
 * Returns rowCount + sample rows (first 50) for SELECT queries.
 */
const pg = require("pg");

exports.handler = async (event) => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const results = [];
  try {
    for (const entry of event.statements || []) {
      const sql = typeof entry === "string" ? entry : entry.sql;
      const params = typeof entry === "string" ? undefined : entry.params;
      try {
        const r = await pool.query(sql, params);
        results.push({
          ok: true,
          rowCount: r.rowCount,
          rows: (r.rows || []).slice(0, 50),
          preview: sql.substring(0, 80),
        });
      } catch (e) {
        results.push({ ok: false, error: e.message, preview: sql.substring(0, 80) });
      }
    }
  } finally {
    await pool.end();
  }
  return { statusCode: 200, body: JSON.stringify({ results }) };
};
