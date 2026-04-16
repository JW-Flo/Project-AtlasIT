import pg from "pg";
import { readFileSync } from "fs";

const { Pool } = pg;

// Load complete D1 data export
const D1_DATA = JSON.parse(readFileSync('./d1-complete.json', 'utf8'));

function convert(row) {
  const c = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) c[k] = null;
    else if (typeof v === "number" && Number.isInteger(v) && k.includes("_at"))
      c[k] = new Date(v).toISOString();
    else if (typeof v === "number" && (k.includes("enabled")||k.includes("healthy")||k==="processed"))
      c[k] = v === 1;
    else c[k] = v;
  }
  return c;
}

async function importToPg(pool, table, rows) {
  if (!rows || rows.length === 0) {
    console.log(`[PG] ${table}: skip (empty)`);
    return;
  }

  const converted = rows.map(convert);
  const cols = Object.keys(converted[0]);
  const placeholders = converted.map((_, i) =>
    `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`
  ).join(", ");
  const values = converted.flatMap(r => cols.map(c => r[c]));

  try {
    const result = await pool.query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
      values
    );
    console.log(`[PG] ${table}: ${result.rowCount} rows inserted`);
  } catch (err) {
    console.error(`[PG] ${table}: ERROR - ${err.message}`);
    throw err;
  }
}

export const handler = async (event) => {
  console.log("=".repeat(60));
  console.log("  D1 → PostgreSQL Migration (Lambda)");
  console.log("=".repeat(60));

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  try {
    const migrated = {};
    for (const [table, rows] of Object.entries(D1_DATA)) {
      await importToPg(pool, table, rows);
      migrated[table] = rows.length;
    }

    console.log("");
    console.log("✅ Migration complete");

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", migrated })
    };
  } finally {
    await pool.end();
  }
};
