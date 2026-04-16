#!/usr/bin/env node

/**
 * Apply a SQL migration file to Aurora RDS via the core-api Lambda.
 * Invokes the Lambda directly (which has VPC access to RDS).
 *
 * Usage: node scripts/apply-pg-migration.mjs migrations/0049_access_requests_notifications_pg.sql
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
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

// Strip single-line comments and split on semicolons
const stripped = sql
  .split("\n")
  .map((line) => line.replace(/--.*$/, ""))   // remove -- comments
  .join("\n");
const statements = stripped
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Found ${statements.length} SQL statements`);

const env = process.env.ENV || "dev";
const client = new LambdaClient({ region });
const ssm = new SSMClient({ region });

// Read the internal API key from SSM
let internalApiKey = process.env.INTERNAL_API_KEY || "";
if (!internalApiKey) {
  try {
    const ssmResp = await ssm.send(new GetParameterCommand({
      Name: `/atlasit/${env}/secrets/internal-api-key`,
      WithDecryption: true,
    }));
    internalApiKey = ssmResp.Parameter?.Value || "";
    console.log("Read INTERNAL_API_KEY from SSM");
  } catch (e) {
    console.warn("Could not read INTERNAL_API_KEY from SSM:", e.message);
  }
}
if (!internalApiKey) {
  console.error("ERROR: INTERNAL_API_KEY not available. Set ENV var or populate SSM.");
  process.exit(1);
}

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
    "x-internal-api-key": internalApiKey,
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
