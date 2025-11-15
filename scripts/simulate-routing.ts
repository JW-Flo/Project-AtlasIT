#!/usr/bin/env node
import { readFile } from "fs/promises";
import { join } from "path";

// Import routing logic from worker
import { routePR, PRMetadata, RoutingDecision } from "../ops/agent-router-worker/worker.js";

// Test scenarios
interface TestScenario {
  name: string;
  pr: PRMetadata;
  expected: {
    severity: string;
    primary_agent: string;
    has_prohibited?: boolean;
  };
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: "Documentation-only PR (low severity)",
    pr: {
      number: 1,
      title: "docs: Update README",
      labels: ["documentation"],
      files_changed: ["README.md", "docs/guide.md"],
      author: "developer",
    },
    expected: {
      severity: "low",
      primary_agent: "github-review",
    },
  },
  {
    name: "Schema change (medium severity, Codex assignment)",
    pr: {
      number: 2,
      title: "feat: Update evidence schema",
      labels: ["feature"],
      files_changed: ["EVIDENCE_SCHEMA.json", "docs/schema.md"],
      author: "developer",
    },
    expected: {
      severity: "medium",
      primary_agent: "codex",
    },
  },
  {
    name: "Workflow change (high severity)",
    pr: {
      number: 3,
      title: "ops: Add new CI workflow",
      labels: ["ops"],
      files_changed: [".github/workflows/new-workflow.yml"],
      author: "ops-team",
    },
    expected: {
      severity: "high",
      primary_agent: "github-review",
    },
  },
  {
    name: "Drift detection PR (medium severity, keyword match)",
    pr: {
      number: 4,
      title: "fix: Resolve drift in structure",
      labels: ["automated"],
      files_changed: ["DRIFT_DETECTION_SPEC.md"],
      author: "drift-agent",
    },
    expected: {
      severity: "medium",
      primary_agent: "codex",
    },
  },
  {
    name: "Security-related PR (high severity, keyword match)",
    pr: {
      number: 5,
      title: "fix: Critical security vulnerability",
      labels: ["security"],
      files_changed: ["packages/auth/src/validate.ts"],
      author: "security-team",
    },
    expected: {
      severity: "high",
      primary_agent: "github-review",
    },
  },
  {
    name: "Prohibited pattern (critical severity)",
    pr: {
      number: 6,
      title: "test: Add TODO_REMOVE debugging",
      labels: ["wip"],
      files_changed: ["src/debug.ts"],
      author: "developer",
    },
    expected: {
      severity: "critical",
      primary_agent: "github-review",
      has_prohibited: true,
    },
  },
];

// Validate routing decision against expected
function validateDecision(
  scenario: TestScenario,
  decision: RoutingDecision
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (decision.severity !== scenario.expected.severity) {
    errors.push(`Expected severity '${scenario.expected.severity}', got '${decision.severity}'`);
  }

  if (decision.agents.primary !== scenario.expected.primary_agent) {
    errors.push(
      `Expected primary agent '${scenario.expected.primary_agent}', got '${decision.agents.primary}'`
    );
  }

  if (scenario.expected.has_prohibited && decision.prohibited_hits.length === 0) {
    errors.push("Expected prohibited patterns, but none found");
  }

  return { passed: errors.length === 0, errors };
}

// Load and validate rules.json
async function validateRules(): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const rulesPath = join(process.cwd(), "ops/agent-router-worker/rules.json");
    const rulesContent = await readFile(rulesPath, "utf-8");
    const rules = JSON.parse(rulesContent);

    // Validate rule structure
    if (!rules.severity_by_path || typeof rules.severity_by_path !== "object") {
      errors.push("Missing or invalid severity_by_path");
    }

    if (!rules.severity_by_keyword || typeof rules.severity_by_keyword !== "object") {
      errors.push("Missing or invalid severity_by_keyword");
    }

    if (!Array.isArray(rules.codex_assignment_triggers)) {
      errors.push("Missing or invalid codex_assignment_triggers");
    }

    if (!Array.isArray(rules.evidence_required)) {
      errors.push("Missing or invalid evidence_required");
    }

    if (!Array.isArray(rules.prohibited_patterns)) {
      errors.push("Missing or invalid prohibited_patterns");
    }

    // Validate severity values
    const validSeverities = ["low", "medium", "high", "critical"];

    for (const [path, severity] of Object.entries(rules.severity_by_path)) {
      if (!validSeverities.includes(severity as string)) {
        errors.push(`Invalid severity '${severity}' for path '${path}'`);
      }
    }

    for (const [keyword, severity] of Object.entries(rules.severity_by_keyword)) {
      if (!validSeverities.includes(severity as string)) {
        errors.push(`Invalid severity '${severity}' for keyword '${keyword}'`);
      }
    }
  } catch (error) {
    errors.push(
      `Failed to load rules.json: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return { valid: errors.length === 0, errors };
}

// Main simulation
async function simulateRouting(): Promise<void> {
  console.log("🧪 Agent Routing Simulation\n");

  // Validate rules first
  console.log("📋 Validating routing rules...\n");
  const rulesValidation = await validateRules();

  if (!rulesValidation.valid) {
    console.error("❌ Rules validation failed:");
    for (const error of rulesValidation.errors) {
      console.error(`   - ${error}`);
    }
    process.exit(1);
  }

  console.log("✅ Rules validation passed\n");

  // Run test scenarios
  let passed = 0;
  let failed = 0;

  for (const scenario of TEST_SCENARIOS) {
    console.log(`🔍 ${scenario.name}`);
    console.log(`   PR #${scenario.pr.number}: ${scenario.pr.title}`);
    console.log(`   Files: ${scenario.pr.files_changed.join(", ")}`);

    try {
      // Route the PR with simulation mode enabled
      const decision = await routePR(scenario.pr, {}, true);

      // Validate decision
      const validation = validateDecision(scenario, decision);

      if (validation.passed) {
        console.log(`   ✅ PASSED`);
        console.log(`      Severity: ${decision.severity}`);
        console.log(`      Agent: ${decision.agents.primary}`);

        if (decision.rule_summary) {
          console.log(`      Matched paths: ${decision.rule_summary.matched_paths.length}`);
          console.log(`      Matched keywords: ${decision.rule_summary.matched_keywords.length}`);
        }

        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        for (const error of validation.errors) {
          console.log(`      - ${error}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
      failed++;
    }

    console.log();
  }

  // Summary
  console.log("📊 Simulation Summary");
  console.log(`   Total: ${TEST_SCENARIOS.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log();

  if (failed > 0) {
    console.error("❌ Routing simulation failed");
    process.exit(1);
  } else {
    console.log("✅ All routing simulations passed");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simulateRouting().catch((error) => {
    console.error("❌ Simulation failed:", error);
    process.exit(1);
  });
}

export { simulateRouting, TEST_SCENARIOS };
