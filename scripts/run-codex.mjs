#!/usr/bin/env node
/**
 * Codex Runner - Autonomous execution of fenced command plans
 *
 * Reads `## COMMAND PLAN` section (flexible whitespace matching) from ops/hand-off.md,
 * executes each command sequentially, and logs output to .codex.done
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Extract the COMMAND PLAN section from hand-off.md
 */
async function extractCommandPlan(filePath) {
  const content = await readFile(filePath, "utf-8");

  // Find all ## COMMAND PLAN sections (should be exactly one)
  const commandPlanRegex =
    /##\s+COMMAND\s+PLAN\s*\n\s*```(?:bash)?\s*\n([\s\S]*?)\n\s*```/gi;
  const matches = Array.from(content.matchAll(commandPlanRegex));

  if (matches.length === 0) {
    throw new Error("No ## COMMAND PLAN section found in ops/hand-off.md");
  }
  if (matches.length > 1) {
    throw new Error(
      "Multiple ## COMMAND PLAN sections found in ops/hand-off.md. Please ensure only one exists.",
    );
  }

  const commandBlock = matches[0][1];

  // Split into lines and filter out comments and empty lines
  const commands = commandBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      // Skip empty lines
      if (!line) return false;
      // Skip comment-only lines (lines starting with '#'); inline comments are preserved and handled by bash
      if (line.startsWith("#")) return false;
      return true;
    });

  return commands;
}

// Configuration constants
const COMMAND_TIMEOUT_MS = 300000; // 5 minutes per command
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB max output per command

/**
 * Sanitize output to remove potential secrets
 */
function sanitizeOutput(output) {
  if (!output) return output;

  // Truncate if too large
  if (output.length > MAX_OUTPUT_SIZE) {
    return (
      output.substring(0, MAX_OUTPUT_SIZE) +
      "\n\n[Output truncated - exceeded 1MB limit]"
    );
  }

  // Redact common secret patterns
  let sanitized = output;
  // Redact long base64-like strings that might be secrets
  sanitized = sanitized.replace(
    /([a-zA-Z0-9+/]{40,}={0,2})/g,
    "[REDACTED_BASE64]",
  );
  // Redact bearer tokens
  sanitized = sanitized.replace(
    /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
    "Bearer [REDACTED]",
  );
  // Redact AWS-style keys
  sanitized = sanitized.replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]");

  return sanitized;
}

/**
 * Filter environment variables to exclude sensitive ones
 */
function getFilteredEnv() {
  const sensitivePatterns = [
    /TOKEN/i,
    /SECRET/i,
    /KEY/i,
    /PASSWORD/i,
    /PASSWD/i,
    /API[_-]?KEY/i,
    /AUTH/i,
    /CREDENTIAL/i,
  ];

  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => {
      return !sensitivePatterns.some((pattern) => pattern.test(key));
    }),
  );
}

/**
 * Execute a single shell command with timeout
 */
async function executeCommand(command, timeoutMs = COMMAND_TIMEOUT_MS) {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn("bash", ["-c", command], {
      stdio: ["ignore", "pipe", "pipe"],
      env: getFilteredEnv(),
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    // Set up timeout
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      }, 5000);
    }, timeoutMs);

    if (proc.stdout) {
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
    }

    if (proc.stderr) {
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    const cleanup = () => {
      clearTimeout(timeout);
    };

    proc.once("close", (code) => {
      cleanup();
      const duration = Date.now() - startTime;
      resolve({
        command,
        exitCode: timedOut ? 124 : (code ?? 1), // 124 is timeout exit code
        stdout: sanitizeOutput(stdout),
        stderr: sanitizeOutput(
          timedOut ? stderr + "\n[Command timed out]" : stderr,
        ),
        duration,
      });
    });

    proc.once("error", (err) => {
      cleanup();
      const duration = Date.now() - startTime;
      resolve({
        command,
        exitCode: 1,
        stdout: sanitizeOutput(stdout),
        stderr: sanitizeOutput(stderr + "\nSpawn error: " + err.message),
        duration,
      });
    });
  });
}

/**
 * Main execution function
 */
async function main() {
  const traceId = randomUUID();
  const timestamp = new Date().toISOString();

  console.log(`[Codex Runner] Starting execution - trace_id: ${traceId}`);
  console.log(`[Codex Runner] Timestamp: ${timestamp}\n`);

  // Require explicit enabling via environment variable to execute commands
  if (process.env.CODEX_RUN_ENABLED !== "true") {
    const msg = "Codex Runner disabled: set CODEX_RUN_ENABLED=true to enable execution.";
    console.log(msg);
    await writeFile(
      ".codex.done",
      `Codex Runner skipped\nTrace ID: ${traceId}\nTimestamp: ${timestamp}\nReason: CODEX_RUN_ENABLED != true\n`,
      "utf-8",
    );
    process.exit(0);
  }

  // Extract commands from hand-off.md
  const handoffPath = path.join(process.cwd(), "ops/hand-off.md");
  let commands;

  try {
    commands = await extractCommandPlan(handoffPath);
    console.log(
      `[Codex Runner] Found ${commands.length} commands to execute\n`,
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Codex Runner] ERROR: ${errorMsg}`);

    // Write error to .codex.done
    const errorLog = `Codex Runner Execution Failed
Trace ID: ${traceId}
Timestamp: ${timestamp}
Error: ${errorMsg}
`;
    await writeFile(".codex.done", errorLog, "utf-8");
    process.exit(1);
  }

  // Allowed command whitelist (prefix-based). Only commands starting with
  // these prefixes will be executed. This prevents arbitrary destructive
  // commands from being run unintentionally.
  const ALLOWED_PREFIXES = [
    "git ",
    "npm ",
    "node ",
    "ls ",
    "echo ",
    "cat ",
    "sed ",
    "awk ",
    "curl ",
    "jq ",
    "docker ",
    "wrangler ",
  ];

  // Execute commands sequentially
  const results = [];
  let failedCommands = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(
      `[${i + 1}/${commands.length}] Executing: ${command.substring(0, 100)}${command.length > 100 ? "..." : ""}`,
    );

    // Enforce whitelist by prefix
    const allowed = ALLOWED_PREFIXES.some((p) => command.startsWith(p));
    if (!allowed) {
      console.log(`  SKIPPED (not whitelisted): ${command}`);
      results.push({
        command,
        exitCode: 0,
        stdout: "",
        stderr: "[SKIPPED - command not whitelisted]",
        duration: 0,
      });
      continue;
    }

    const result = await executeCommand(command);
    results.push(result);

    if (result.stdout) {
      console.log(
        `  STDOUT: ${result.stdout.substring(0, 200)}${result.stdout.length > 200 ? "..." : ""}`,
      );
    }
    if (result.stderr) {
      console.error(
        `  STDERR: ${result.stderr.substring(0, 200)}${result.stderr.length > 200 ? "..." : ""}`,
      );
    }
    console.log(`  Exit code: ${result.exitCode} (${result.duration}ms)\n`);

    if (result.exitCode !== 0) {
      failedCommands++;
      // Continue execution even if a command fails (best effort)
    }
  }

  // Generate .codex.done report
  const report = generateReport(traceId, timestamp, results, failedCommands);
  await writeFile(".codex.done", report, "utf-8");
  console.log("[Codex Runner] Execution log written to .codex.done");

  // Generate evidence artifact
  const evidence = {
    trace_id: traceId,
    tenant_id: process.env.TENANT_ID || "system",
    subject_id: process.env.GITHUB_ACTOR || "github-actions",
    control_id: "CODEX_RUNNER_EXECUTION",
    timestamp,
    status: failedCommands === 0 ? "pass" : "fail",
    commands_executed: results.length,
    commands_failed: failedCommands,
    execution_results: results,
    whitelist: ALLOWED_PREFIXES,
  };

  const artifactsDir = path.join(process.cwd(), "artifacts");
  await mkdir(artifactsDir, { recursive: true });

  const evidencePath = path.join(
    artifactsDir,
    `EV-codex-runner-${traceId}.json`,
  );
  await writeFile(
    evidencePath,
    JSON.stringify(evidence, null, 2) + "\n",
    "utf-8",
  );
  console.log(
    `[Codex Runner] Evidence artifact written to ${path.relative(process.cwd(), evidencePath)}`,
  );

  // Summary
  console.log(`\n[Codex Runner] Execution complete`);
  console.log(`  Total commands: ${results.length}`);
  console.log(`  Successful: ${results.length - failedCommands}`);
  console.log(`  Failed: ${failedCommands}`);
  console.log(`  Status: ${failedCommands === 0 ? "PASS" : "FAIL"}`);

  // Exit with error if any commands failed
  if (failedCommands > 0) {
    process.exit(1);
  }
}

/**
 * Generate human-readable execution report
 */
function generateReport(traceId, timestamp, results, failedCommands) {
  const lines = [
    "# Codex Runner Execution Report",
    "",
    `**Trace ID:** ${traceId}`,
    `**Timestamp:** ${timestamp}`,
    `**Status:** ${failedCommands === 0 ? "✅ PASS" : "❌ FAIL"}`,
    `**Commands Executed:** ${results.length}`,
    `**Commands Failed:** ${failedCommands}`,
    "",
    "---",
    "",
    "## Execution Results",
    "",
  ];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const status = result.exitCode === 0 ? "✅" : "❌";

    lines.push(`### [${i + 1}] ${status} Command (${result.duration}ms)`);
    lines.push("");
    lines.push("```bash");
    lines.push(result.command);
    lines.push("```");
    lines.push("");
    lines.push(`**Exit Code:** ${result.exitCode}`);

    if (result.stdout) {
      lines.push("");
      lines.push("**STDOUT:**");
      lines.push("```");
      lines.push(result.stdout);
      lines.push("```");
    }

    if (result.stderr) {
      lines.push("");
      lines.push("**STDERR:**");
      lines.push("```");
      lines.push(result.stderr);
      lines.push("```");
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push(`Execution completed at ${new Date().toISOString()}`);
  lines.push(
    `Total duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`,
  );
  lines.push("");

  return lines.join("\n");
}

// Run the main function
main().catch((err) => {
  console.error("[Codex Runner] Fatal error:", err);
  process.exit(1);
});
