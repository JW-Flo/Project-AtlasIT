#!/usr/bin/env node
/**
 * Evidence Hash Utility
 *
 * Generates SHA-256 hash of a file and outputs evidence metadata
 *
 * Usage: npx tsx scripts/evidence_hash.ts <file_path> [producer] [control_id]
 */

import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";

interface EvidenceMetadata {
  id: string;
  hash: string;
  uri: string;
  producer: string;
  control_id: string;
  timestamp: string;
  file_size: number;
  file_path: string;
}

function generateHash(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function generateEvidence(
  filePath: string,
  producer: string = "cursor",
  controlId: string = "GENERAL",
): EvidenceMetadata {
  const hash = generateHash(filePath);
  const stats = fs.statSync(filePath);
  const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  return {
    id,
    hash: `sha256:${hash}`,
    uri: `file://${path.resolve(filePath)}`,
    producer,
    control_id: controlId,
    timestamp: new Date().toISOString(),
    file_size: stats.size,
    file_path: path.resolve(filePath),
  };
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: npx tsx evidence_hash.ts <file_path> [producer] [control_id]",
    );
    process.exit(1);
  }

  const [filePath, producer, controlId] = args;

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const evidence = generateEvidence(filePath, producer, controlId);
  console.log(JSON.stringify(evidence, null, 2));
}

export { generateHash, generateEvidence };
