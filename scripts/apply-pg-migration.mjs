#!/usr/bin/env node

/**
 * Apply a SQL migration file to Aurora RDS via the core-api Lambda.
 * Invokes the Lambda directly (which has VPC access to RDS).
 *
 * Usage: node scripts/apply-pg-migration.mjs migrations/0049_access_requests_notifications_pg.sql
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { readFileSync } from "fs";

const region = "us-east-1";
const functionName = "atlasit-core-api-dev";

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/apply-pg-migration.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf8");
console.log(`Applying migration: ${sqlFile} (${sql.length} bytes)`);

// Split on semicolons for individual statements
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

console.log(`Found ${statements.length} SQL statements`);

const client = new LambdaClient({ region });

// Invoke the Lambda with a special admin event that runs raw SQL
// This uses the internal API key auth path
const event = {
  rawPath: "/api/v1/admin/migrate",
  requestContext: {
    http: { method: "POST", path: "/api/v1/admin/migrate" },
    requestId: `migration-${Date.now()}`,
  },
  headers: {
    "content-type": "application/json",
    "x-internal-api-key": "WILL_BE_READ_FROM_ENV_BY_LAMBDA",
  },
  body: JSON.stringify({ statements }),
  isBase64Encoded: false,
};

try {
  const response = await client.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(event)),
    }),
  );

  const payload = JSON.parse(Buffer.from(response.Payload).toString());
  console.log(`Lambda response (${response.StatusCode}):`, JSON.stringify(payload, null, 2));

  if (payload.statusCode >= 400) {
    console.error("Migration failed — Lambda returned error");
    process.exit(1);
  }
} catch (err) {
  console.error("Lambda invocation failed:", err.message);
  process.exit(1);
}
