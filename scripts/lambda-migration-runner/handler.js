/**
 * One-off migration runner. Invoke via:
 *   aws lambda invoke --function-name atlasit-migration-runner \
 *     --cli-binary-format raw-in-base64-out \
 *     --payload '{"statements":["CREATE TABLE ..."]}' output.json
 */
const pg = require('pg');

exports.handler = async (event) => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const results = [];
  try {
    for (const sql of event.statements || []) {
      try {
        const r = await pool.query(sql);
        results.push({ ok: true, rows: r.rowCount, preview: sql.substring(0, 80) });
      } catch (e) {
        results.push({ ok: false, error: e.message, preview: sql.substring(0, 80) });
      }
    }
  } finally {
    await pool.end();
  }
  return { statusCode: 200, body: JSON.stringify({ results }) };
};
