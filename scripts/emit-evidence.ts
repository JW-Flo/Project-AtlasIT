#!/usr/bin/env node
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Evidence schema interface
interface Evidence {
  trace_id: string;
  control_id: string;
  timestamp: string;
  tenant_id?: string;
  subject_id?: string;
  decision_ref?: string;
  severity?: "low" | "medium" | "high" | "critical";
  agent?: string;
  action?: string;
  result?: "pass" | "fail" | "skip" | "error";
  metadata?: Record<string, unknown>;
}

// Generate evidence artifact
async function emitEvidence(evidence: Partial<Evidence>): Promise<string> {
  const traceId = evidence.trace_id || randomUUID();

  const fullEvidence: Evidence = {
    trace_id: traceId,
    control_id: evidence.control_id || "CI-001",
    timestamp: evidence.timestamp || new Date().toISOString(),
    tenant_id: evidence.tenant_id,
    subject_id: evidence.subject_id,
    decision_ref: evidence.decision_ref,
    severity: evidence.severity,
    agent: evidence.agent || "ci-workflow",
    action: evidence.action || "build",
    result: evidence.result || "pass",
    metadata: evidence.metadata || {},
  };

  // Ensure .evidence directory exists
  const evidenceDir = join(process.cwd(), ".evidence");
  await mkdir(evidenceDir, { recursive: true });

  // Write evidence file
  const evidencePath = join(evidenceDir, `${traceId}.json`);
  await writeFile(evidencePath, JSON.stringify(fullEvidence, null, 2));

  console.log(`✅ Evidence emitted: ${traceId}`);
  console.log(`   Control ID: ${fullEvidence.control_id}`);
  console.log(`   Action: ${fullEvidence.action}`);
  console.log(`   Result: ${fullEvidence.result}`);
  console.log(`   Path: ${evidencePath}`);

  return traceId;
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse command-line arguments
  const evidence: Partial<Evidence> = {
    agent: process.env.GITHUB_WORKFLOW || "ci-workflow",
    action: args[0] || "ci_run",
    result: (args[1] as "pass" | "fail" | "skip" | "error") || "pass",
    control_id: args[2] || "CI-001",
    metadata: {
      run_id: process.env.GITHUB_RUN_ID,
      run_number: process.env.GITHUB_RUN_NUMBER,
      actor: process.env.GITHUB_ACTOR,
      repository: process.env.GITHUB_REPOSITORY,
      ref: process.env.GITHUB_REF,
      sha: process.env.GITHUB_SHA,
    },
  };

  await emitEvidence(evidence);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Failed to emit evidence:", error);
    process.exit(1);
  });
}

export { emitEvidence, Evidence };
