#!/usr/bin/env node
/**
 * Run a single PostgreSQL migration file
 * Usage: node scripts/run-migration.js <migration-file>
 */

import { readFile } from "fs/promises";
import pg from "pg";

const { Pool } = pg;

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://atlasit_admin:atlasit2024@atlasit-rds-dev.c6csxvkz9rez.us-east-1.rds.amazonaws.com:5432/atlasit";

async function runMigration(filePath) {
  const pool = new Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`Reading migration: ${filePath}`);
    const sql = await readFile(filePath, "utf-8");

    console.log(`Executing migration...`);
    await pool.query(sql);

    console.log(`✓ Migration applied successfully`);
  } catch (err) {
    console.error(`✗ Migration failed:`, err.message);
    if (err.detail) console.error(`  Detail: ${err.detail}`);
    if (err.hint) console.error(`  Hint: ${err.hint}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Usage: node scripts/run-migration.js <migration-file>");
  process.exit(1);
}

runMigration(migrationFile);
