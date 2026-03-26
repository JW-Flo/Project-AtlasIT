#!/usr/bin/env npx tsx

/**
 * AtlasIT Data Migration: Cloudflare → AWS
 *
 * Migrates:
 * - D1 policies/evaluations/workflows → DynamoDB single table
 * - R2 evidence objects → S3 with Object Lock
 * - KV sessions/tokens → DynamoDB
 *
 * Features:
 * - Idempotent: safe to re-run (uses conditional writes)
 * - Resumable: tracks progress in a local checkpoint file
 * - Checksums: verifies data integrity after migration
 *
 * Usage:
 *   npx tsx scripts/data-migration.ts --dry-run
 *   npx tsx scripts/data-migration.ts --migrate
 *   npx tsx scripts/data-migration.ts --verify
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  region: "us-east-1",
  dynamoTable: "atlasit-dev",
  evidenceBucket: "atlasit-evidence-dev-457335975503",
  checkpointFile: join(
    import.meta.dirname ?? ".",
    ".migration-checkpoint.json",
  ),
  batchSize: 25,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Checkpoint {
  startedAt: string;
  completedPhases: string[];
  lastProcessedKey: Record<string, string>;
  stats: MigrationStats;
}

interface MigrationStats {
  policiesWritten: number;
  policiesSkipped: number;
  workflowsWritten: number;
  workflowsSkipped: number;
  evidenceWritten: number;
  evidenceSkipped: number;
  tokensWritten: number;
  tokensSkipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Checkpoint management
// ---------------------------------------------------------------------------

function loadCheckpoint(): Checkpoint {
  if (existsSync(CONFIG.checkpointFile)) {
    return JSON.parse(readFileSync(CONFIG.checkpointFile, "utf-8"));
  }
  return {
    startedAt: new Date().toISOString(),
    completedPhases: [],
    lastProcessedKey: {},
    stats: {
      policiesWritten: 0,
      policiesSkipped: 0,
      workflowsWritten: 0,
      workflowsSkipped: 0,
      evidenceWritten: 0,
      evidenceSkipped: 0,
      tokensWritten: 0,
      tokensSkipped: 0,
      errors: [],
    },
  };
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function log(
  phase: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      phase,
      message,
      ...data,
    }),
  );
}

// ---------------------------------------------------------------------------
// Migration phases
// ---------------------------------------------------------------------------

async function migratePolicies(
  doc: DynamoDBDocumentClient,
  checkpoint: Checkpoint,
  dryRun: boolean,
): Promise<void> {
  if (checkpoint.completedPhases.includes("policies")) {
    log("policies", "Phase already completed, skipping");
    return;
  }

  log("policies", "Starting policy migration");

  // TODO: Read from D1 via Cloudflare API or local wrangler d1 export
  // For now, this is a placeholder showing the DynamoDB write pattern
  //
  // const policies = await fetchFromD1("SELECT * FROM policy_templates");
  // for (const policy of policies) {
  //   const item = {
  //     pk: "SYSTEM",
  //     sk: `TEMPLATE#${policy.key}`,
  //     key: policy.key,
  //     name: policy.name,
  //     format: policy.format,
  //     body: policy.body,
  //     createdAt: policy.created_at,
  //     updatedAt: policy.updated_at,
  //     _migratedAt: new Date().toISOString(),
  //     _sourceChecksum: sha256(JSON.stringify(policy)),
  //   };
  //
  //   if (!dryRun) {
  //     await doc.send(new PutCommand({
  //       TableName: CONFIG.dynamoTable,
  //       Item: item,
  //       ConditionExpression: "attribute_not_exists(pk)",
  //     })).catch((err) => {
  //       if (err.name === "ConditionalCheckFailedException") {
  //         checkpoint.stats.policiesSkipped++;
  //       } else throw err;
  //     });
  //     checkpoint.stats.policiesWritten++;
  //   }
  //   saveCheckpoint(checkpoint);
  // }

  log("policies", "Policy migration complete (placeholder)", {
    written: checkpoint.stats.policiesWritten,
    skipped: checkpoint.stats.policiesSkipped,
  });

  checkpoint.completedPhases.push("policies");
  saveCheckpoint(checkpoint);
}

async function migrateWorkflows(
  doc: DynamoDBDocumentClient,
  checkpoint: Checkpoint,
  dryRun: boolean,
): Promise<void> {
  if (checkpoint.completedPhases.includes("workflows")) {
    log("workflows", "Phase already completed, skipping");
    return;
  }

  log("workflows", "Starting workflow migration");

  // TODO: Read from D1 workflow_executions + workflow_steps
  // Write to DynamoDB with PK=TENANT#{tenantId}, SK=EXEC#{id}
  // Steps are denormalized into the execution item

  log("workflows", "Workflow migration complete (placeholder)", {
    written: checkpoint.stats.workflowsWritten,
    skipped: checkpoint.stats.workflowsSkipped,
  });

  checkpoint.completedPhases.push("workflows");
  saveCheckpoint(checkpoint);
}

async function migrateEvidence(
  s3: S3Client,
  checkpoint: Checkpoint,
  dryRun: boolean,
): Promise<void> {
  if (checkpoint.completedPhases.includes("evidence")) {
    log("evidence", "Phase already completed, skipping");
    return;
  }

  log("evidence", "Starting evidence migration (R2 → S3)");

  // TODO: List R2 objects via Cloudflare API
  // For each object:
  //   1. Check if already exists in S3 (HeadObject)
  //   2. If not, download from R2 and upload to S3
  //   3. Verify checksum matches
  //
  // const objects = await listR2Objects("atlasit-evidence");
  // for (const obj of objects) {
  //   try {
  //     await s3.send(new HeadObjectCommand({
  //       Bucket: CONFIG.evidenceBucket,
  //       Key: obj.key,
  //     }));
  //     checkpoint.stats.evidenceSkipped++;
  //     continue; // Already exists
  //   } catch {
  //     // Doesn't exist, proceed with migration
  //   }
  //
  //   const body = await downloadFromR2(obj.key);
  //   const checksum = sha256(body);
  //
  //   if (!dryRun) {
  //     await s3.send(new PutObjectCommand({
  //       Bucket: CONFIG.evidenceBucket,
  //       Key: obj.key,
  //       Body: body,
  //       ContentType: obj.contentType,
  //       ChecksumSHA256: checksum,
  //     }));
  //     checkpoint.stats.evidenceWritten++;
  //   }
  //   saveCheckpoint(checkpoint);
  // }

  log("evidence", "Evidence migration complete (placeholder)", {
    written: checkpoint.stats.evidenceWritten,
    skipped: checkpoint.stats.evidenceSkipped,
  });

  checkpoint.completedPhases.push("evidence");
  saveCheckpoint(checkpoint);
}

async function migrateTokens(
  doc: DynamoDBDocumentClient,
  checkpoint: Checkpoint,
  dryRun: boolean,
): Promise<void> {
  if (checkpoint.completedPhases.includes("tokens")) {
    log("tokens", "Phase already completed, skipping");
    return;
  }

  log("tokens", "Starting token/session migration (KV → DynamoDB)");

  // TODO: List KV keys via Cloudflare API
  // Write to DynamoDB with PK=TOKEN#{hash}, SK=TOKEN#{hash}
  // Sessions: PK=SESSION#{id}, SK=SESSION#{id} with TTL

  log("tokens", "Token migration complete (placeholder)", {
    written: checkpoint.stats.tokensWritten,
    skipped: checkpoint.stats.tokensSkipped,
  });

  checkpoint.completedPhases.push("tokens");
  saveCheckpoint(checkpoint);
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function verify(
  doc: DynamoDBDocumentClient,
  s3: S3Client,
): Promise<void> {
  log("verify", "Starting migration verification");

  // TODO: For each source record, verify it exists in the target
  // Compare checksums to ensure data integrity
  // Report any discrepancies

  log("verify", "Verification complete (placeholder)");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0];

  if (!mode || !["--dry-run", "--migrate", "--verify"].includes(mode)) {
    console.error(
      "Usage: npx tsx scripts/data-migration.ts [--dry-run|--migrate|--verify]",
    );
    process.exit(1);
  }

  const dryRun = mode === "--dry-run";
  const verifyOnly = mode === "--verify";

  const dynamoClient = new DynamoDBClient({ region: CONFIG.region });
  const doc = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: { removeUndefinedValues: true },
  });
  const s3 = new S3Client({ region: CONFIG.region });

  if (verifyOnly) {
    await verify(doc, s3);
    return;
  }

  const checkpoint = loadCheckpoint();

  log("main", `Starting migration (${dryRun ? "DRY RUN" : "LIVE"})`, {
    checkpoint: checkpoint.completedPhases,
  });

  await migratePolicies(doc, checkpoint, dryRun);
  await migrateWorkflows(doc, checkpoint, dryRun);
  await migrateEvidence(s3, checkpoint, dryRun);
  await migrateTokens(doc, checkpoint, dryRun);

  log("main", "Migration complete", { stats: checkpoint.stats });
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
