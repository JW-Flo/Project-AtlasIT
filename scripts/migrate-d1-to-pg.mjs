#!/usr/bin/env node
/**
 * Migrate data from Cloudflare D1 to Aurora PostgreSQL
 *
 * Usage:
 *   ENV=dev node scripts/migrate-d1-to-pg.mjs [--tables table1,table2] [--dry-run]
 *
 * Exports all data from D1 (atlasit-shared) and imports into Aurora PG.
 * Handles SQLite→PostgreSQL type conversions and respects FK constraints.
 *
 * IMPORTANT: Must run from within AWS VPC (Lambda, EC2, CloudShell) since
 * Aurora RDS is private. Local execution will fail with ENOTFOUND.
 */

import { exec } from "child_process";
import { promisify } from "util";
import pg from "pg";

const execAsync = promisify(exec);
const { Pool } = pg;

const ENV = process.env.ENV || "dev";
const DRY_RUN = process.argv.includes("--dry-run");
const TABLES_ARG = process.argv.find((a) => a.startsWith("--tables="));
const SELECTED_TABLES = TABLES_ARG
  ? TABLES_ARG.split("=")[1].split(",")
  : null;

// Migration order respects FK constraints
const ALL_TABLES = [
  "tenants",
  "users",
  "console_users",
  "directory_users",
  "directory_groups",
  "directory_memberships",
  "app_credentials",
  "integrations",
  "directory_changelog",
  "workflow_runs",
  "jml_policies",
  "workflow_templates",
  "nhi_credentials",
  "discovered_apps",
  "compliance_evidence",
  "compliance_scores",
  "tenant_compliance_packs",
  "automation_rules",
  "automation_executions",
  "policies",
  "incidents",
  "audit_log",
];

const TABLES_TO_MIGRATE = SELECTED_TABLES || ALL_TABLES;

async function getDbUrl() {
  // Try env var first (for local testing)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Fall back to reading from deployed Lambda env
  const { stdout } = await execAsync(
    `"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda get-function-configuration --function-name atlasit-core-api-${ENV} --output json`
  );
  const config = JSON.parse(stdout.trim());
  return config.Environment.Variables.DATABASE_URL;
}

async function exportFromD1(table) {
  console.log(`[D1] Exporting ${table}...`);
  const cmd = `npx wrangler d1 execute atlasit-shared --remote --command "SELECT * FROM ${table};" --json`;
  const { stdout } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
  const response = JSON.parse(stdout);
  const rows = response[0]?.results || [];
  console.log(`[D1] ${table}: ${rows.length} rows`);
  return rows;
}

function convertSqliteTypes(row) {
  const converted = {};
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) {
      converted[key] = null;
    } else if (typeof val === "number" && Number.isInteger(val) && (key.includes("_at") || key === "created_at" || key === "updated_at")) {
      // SQLite stores timestamps as Unix ms integers; PG expects ISO strings
      converted[key] = new Date(val).toISOString();
    } else if (typeof val === "number" && (key.includes("enabled") || key.includes("healthy") || key === "processed")) {
      // SQLite booleans are 0/1; PG expects true/false
      converted[key] = val === 1;
    } else {
      converted[key] = val;
    }
  }
  return converted;
}

async function importToPg(pool, table, rows) {
  if (rows.length === 0) {
    console.log(`[PG] ${table}: skipping (empty)`);
    return;
  }

  const converted = rows.map(convertSqliteTypes);
  const cols = Object.keys(converted[0]);
  const placeholders = converted
    .map(
      (_, i) =>
        `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`
    )
    .join(", ");

  const values = converted.flatMap((r) => cols.map((c) => r[c]));

  const sql = `
    INSERT INTO ${table} (${cols.join(", ")})
    VALUES ${placeholders}
    ON CONFLICT DO NOTHING
  `;

  if (DRY_RUN) {
    console.log(`[PG] ${table}: DRY RUN — would insert ${rows.length} rows`);
    console.log(`     Sample: ${JSON.stringify(converted[0], null, 2)}`);
    return;
  }

  try {
    const result = await pool.query(sql, values);
    console.log(`[PG] ${table}: inserted ${result.rowCount} rows`);
  } catch (err) {
    console.error(`[PG] ${table}: ERROR — ${err.message}`);
    console.error(`     First row: ${JSON.stringify(converted[0], null, 2)}`);
    throw err;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log(`  D1 → PostgreSQL Migration (ENV=${ENV})`);
  if (DRY_RUN) console.log("  MODE: DRY RUN (no writes)");
  console.log("=".repeat(60));
  console.log("");

  const dbUrl = await getDbUrl();
  console.log(`[DEBUG] DATABASE_URL length: ${dbUrl.length}`);
  console.log(`[DEBUG] DATABASE_URL (masked): ${dbUrl.substring(0, 40)}...${dbUrl.substring(dbUrl.length - 40)}`);
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    for (const table of TABLES_TO_MIGRATE) {
      const rows = await exportFromD1(table);
      await importToPg(pool, table, rows);
    }

    console.log("");
    console.log("✅ Migration complete");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
