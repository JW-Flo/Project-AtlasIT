#!/usr/bin/env node
/**
 * validate-tf-state.mjs — Validate Terraform state against expected resource inventory.
 *
 * Reads terraform state (local or via `terraform show -json`) for each root module
 * and checks that expected resources exist and counts match.
 *
 * Usage:
 *   node scripts/validate-tf-state.mjs
 *   node scripts/validate-tf-state.mjs --module terraform/environments/dev
 *   node scripts/validate-tf-state.mjs --json   # Output as JSON
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve, basename, relative } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");

// ── Expected resource inventory ────────────────────────
// Adjust counts as the platform grows.
const EXPECTED_RESOURCES = {
  cloudflare_workers_kv_namespace: {
    description: "KV Namespaces",
    min_per_env: 1,
  },
  cloudflare_d1_database: {
    description: "D1 Databases",
    min_per_env: 1,
  },
  cloudflare_r2_bucket: {
    description: "R2 Buckets",
    min_per_env: 1,
  },
  cloudflare_worker_script: {
    description: "Worker Scripts",
    min_per_env: 1,
  },
};

// ── CLI args ───────────────────────────────────────────

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const moduleIdx = args.indexOf("--module");
const singleModule = moduleIdx !== -1 ? args[moduleIdx + 1] : null;

// ── Discover root modules ──────────────────────────────

function discoverModules() {
  const modules = [];
  const envsDir = resolve(REPO_ROOT, "terraform/environments");

  if (existsSync(envsDir)) {
    for (const entry of readdirSync(envsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const envPath = resolve(envsDir, entry.name);
        if (existsSync(resolve(envPath, "main.tf"))) {
          modules.push({ name: entry.name, path: envPath });
        }
      }
    }
  }

  const cfDir = resolve(REPO_ROOT, "terraform/cloudflare");
  if (existsSync(resolve(cfDir, "main.tf"))) {
    modules.push({ name: "cloudflare", path: cfDir });
  }

  return modules;
}

// ── Get state for a module ─────────────────────────────

function getModuleState(modulePath) {
  try {
    // Try terraform show first (works with remote state)
    const output = execSync("terraform show -json 2>/dev/null", {
      cwd: modulePath,
      encoding: "utf-8",
      timeout: 30000,
    });
    return JSON.parse(output);
  } catch {
    // Fall back to reading local state file
    const stateFile = resolve(modulePath, "terraform.tfstate");
    if (existsSync(stateFile)) {
      const { readFileSync } = await import("node:fs");
      return JSON.parse(readFileSync(stateFile, "utf-8"));
    }
    return null;
  }
}

// ── Extract resources from state ───────────────────────

function extractResources(state) {
  const resources = [];

  if (!state || !state.values) return resources;

  const rootModule = state.values.root_module;
  if (rootModule && rootModule.resources) {
    resources.push(...rootModule.resources);
  }

  // Check child modules
  if (rootModule && rootModule.child_modules) {
    for (const child of rootModule.child_modules) {
      if (child.resources) {
        resources.push(...child.resources);
      }
    }
  }

  return resources;
}

// ── Validate a module ──────────────────────────────────

function validateModule(moduleName, resources) {
  const report = {
    module: moduleName,
    resource_counts: {},
    missing: [],
    extra: [],
    warnings: [],
    ok: true,
  };

  // Count resources by type
  const counts = {};
  for (const r of resources) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }
  report.resource_counts = counts;

  // Check expected resources
  for (const [type, spec] of Object.entries(EXPECTED_RESOURCES)) {
    const count = counts[type] || 0;
    if (count < spec.min_per_env) {
      report.missing.push({
        type,
        description: spec.description,
        expected_min: spec.min_per_env,
        actual: count,
      });
      report.ok = false;
    }
  }

  // Flag unexpected resource types (not Cloudflare)
  for (const type of Object.keys(counts)) {
    if (
      !type.startsWith("cloudflare_") &&
      !type.startsWith("terraform_") &&
      type !== "null_resource"
    ) {
      report.warnings.push(`Unexpected resource type in Cloudflare module: ${type} (count: ${counts[type]})`);
    }
  }

  return report;
}

// ── Main ───────────────────────────────────────────────

async function main() {
  let modules = discoverModules();

  if (singleModule) {
    const target = resolve(REPO_ROOT, singleModule);
    modules = modules.filter((m) => m.path === target || m.name === singleModule);
    if (modules.length === 0) {
      modules = [{ name: basename(singleModule), path: resolve(REPO_ROOT, singleModule) }];
    }
  }

  const reports = [];
  let hasFailures = false;

  for (const mod of modules) {
    const relPath = relative(REPO_ROOT, mod.path);

    // Attempt to init first
    try {
      execSync("terraform init -input=false -no-color -backend=false 2>/dev/null", {
        cwd: mod.path,
        encoding: "utf-8",
        timeout: 30000,
      });
    } catch {
      // Init may fail if no backend — that's acceptable for validation
    }

    const state = getModuleState(mod.path);

    if (!state) {
      reports.push({
        module: relPath,
        resource_counts: {},
        missing: [],
        extra: [],
        warnings: ["No state found — module may not be initialized or has no deployed resources"],
        ok: false,
        no_state: true,
      });
      continue;
    }

    const resources = extractResources(state);
    const report = validateModule(relPath, resources);
    reports.push(report);

    if (!report.ok) hasFailures = true;
  }

  // ── Output ─────────────────────────────────

  if (jsonOutput) {
    console.log(JSON.stringify({ reports, all_ok: !hasFailures }, null, 2));
  } else {
    console.log("AtlasIT Terraform State Validation");
    console.log("====================================\n");

    for (const report of reports) {
      const status = report.no_state
        ? "\x1b[33mNO STATE\x1b[0m"
        : report.ok
          ? "\x1b[32mOK\x1b[0m"
          : "\x1b[31mFAIL\x1b[0m";

      console.log(`Module: ${report.module}  [${status}]`);

      if (report.no_state) {
        for (const w of report.warnings) {
          console.log(`  WARN: ${w}`);
        }
        console.log("");
        continue;
      }

      // Resource counts
      const types = Object.entries(report.resource_counts);
      if (types.length > 0) {
        console.log("  Resources:");
        for (const [type, count] of types.sort()) {
          const desc = EXPECTED_RESOURCES[type]?.description || type;
          console.log(`    ${desc}: ${count}`);
        }
      } else {
        console.log("  Resources: (none)");
      }

      // Missing
      if (report.missing.length > 0) {
        console.log("  Missing:");
        for (const m of report.missing) {
          console.log(`    - ${m.description} (${m.type}): expected >= ${m.expected_min}, found ${m.actual}`);
        }
      }

      // Warnings
      for (const w of report.warnings) {
        console.log(`  WARN: ${w}`);
      }

      console.log("");
    }

    console.log("====================================");
    console.log(hasFailures ? "\x1b[31mValidation failed\x1b[0m" : "\x1b[32mAll validations passed\x1b[0m");
  }

  process.exit(hasFailures ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
