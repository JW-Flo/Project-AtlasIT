#!/usr/bin/env node
/**
 * evidence_emit.js
 *
 * Generates evidence artifacts with SHA-256 hashes and timestamps
 * for CI/CD pipeline runs. Creates EV-ci-run.json with metadata
 * about the current build/test/scan execution.
 */

import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

/**
 * Calculate SHA-256 hash of file contents
 */
async function sha256File(filepath) {
  const content = await readFile(filepath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Calculate SHA-256 hash of a string or object
 */
function sha256String(data) {
  const content = typeof data === "string" ? data : JSON.stringify(data);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Collect all artifacts from a directory
 */
async function collectArtifacts(dir) {
  const artifacts = [];
  try {
    const files = await readdir(dir);
    for (const file of files) {
      const filepath = join(dir, file);
      const hash = await sha256File(filepath);
      artifacts.push({
        name: file,
        path: relative(process.cwd(), filepath),
        sha256: hash,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}:`, err.message);
  }
  return artifacts;
}

/**
 * Main evidence emission function
 */
async function main() {
  const timestamp = new Date().toISOString();
  const runId =
    process.env.CI_RUN_ID || process.env.GITHUB_RUN_ID || "local-run";
  const sha = process.env.CI_SHA || process.env.GITHUB_SHA || "unknown";
  const ref = process.env.CI_REF || process.env.GITHUB_REF || "unknown";
  const actor = process.env.GITHUB_ACTOR || "unknown";
  const repository =
    process.env.GITHUB_REPOSITORY || "HarderWorkingCo/Project-AtlasIT";

  console.log("Generating evidence artifacts...");
  console.log(`Run ID: ${runId}`);
  console.log(`SHA: ${sha}`);
  console.log(`Ref: ${ref}`);

  // Collect artifacts from CI directory
  const ciArtifacts = await collectArtifacts("artifacts/ci");

  // Build evidence record
  const evidence = {
    version: "1.0.0",
    type: "ci-run-evidence",
    generatedAt: timestamp,
    ci: {
      runId,
      sha,
      ref,
      actor,
      repository,
    },
    artifacts: ciArtifacts,
    checksums: {
      sbom: ciArtifacts.find((a) => a.name === "sbom.json")?.sha256 || null,
      buildLog: ciArtifacts.find((a) => a.name === "build.log")?.sha256 || null,
      testLog: ciArtifacts.find((a) => a.name === "test.log")?.sha256 || null,
    },
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  // Calculate hash of the evidence record itself
  evidence.evidenceHash = sha256String(evidence);

  // Ensure evidence directory exists
  const evidenceDir = "artifacts/evidence";
  await mkdir(evidenceDir, { recursive: true });

  // Write evidence file
  const evidencePath = join(evidenceDir, "EV-ci-run.json");
  await writeFile(
    evidencePath,
    JSON.stringify(evidence, null, 2) + "\n",
    "utf8",
  );

  console.log(`Evidence written to: ${evidencePath}`);
  console.log(`Evidence hash: ${evidence.evidenceHash}`);
  console.log(`Total artifacts: ${ciArtifacts.length}`);

  // Output summary
  const summary = {
    status: "success",
    evidencePath: relative(process.cwd(), evidencePath),
    evidenceHash: evidence.evidenceHash,
    artifactCount: ciArtifacts.length,
    timestamp,
  };

  console.log("\nSummary:");
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error generating evidence:", error);
      process.exit(1);
    });
}

export { main as generateEvidence };
