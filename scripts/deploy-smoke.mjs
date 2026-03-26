#!/usr/bin/env node
/**
 * AtlasIT Post-Deployment Smoke Tests
 * Tests health endpoints and basic authenticated functionality for all workers
 */

const workers = [
  {
    name: "onboarding",
    baseUrl:
      process.env.ONBOARDING_BASE_URL ||
      "https://atlasit-onboarding-prod.workers.dev",
    healthPath: "/health",
    authPath: "/api/onboarding/questions?industry=tech", // Public endpoint
  },
  {
    name: "ai-orchestrator",
    baseUrl:
      process.env.ORCHESTRATOR_BASE_URL ||
      "https://atlasit-orchestrator-prod.workers.dev",
    healthPath: "/health",
    authPath: "/status", // Requires API key
  },
  {
    name: "documentation",
    baseUrl:
      process.env.DOCS_BASE_URL || "https://atlasit-docs-prod.workers.dev",
    healthPath: "/health",
    authPath: "/docs", // Public endpoint
  },
];

const API_KEY = process.env.API_KEY || process.env.ORCHESTRATOR_API_KEY;
const TIMEOUT_MS = 10000;

async function testEndpoint(url, headers = {}, expectStatus = 200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "x-request-id": `smoke-${Date.now()}`,
        "user-agent": "AtlasIT-SmokeTest/1.0",
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now();
    const body = await response.text();
    let json = null;

    try {
      json = JSON.parse(body);
    } catch (e) {
      // Non-JSON response OK for some endpoints
    }

    return {
      ok: response.status === expectStatus,
      status: response.status,
      responseTime: Date.now() - responseTime,
      hasRequestId: response.headers.has("x-request-id"),
      contentType: response.headers.get("content-type"),
      json,
      body: body.substring(0, 200), // Truncate for logging
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      error: error.message,
      responseTime: null,
    };
  }
}

async function smokeTest() {
  console.log("🚀 AtlasIT Deployment Smoke Tests");
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("─".repeat(60));

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (const worker of workers) {
    console.log(`\n📋 Testing ${worker.name.toUpperCase()} worker`);
    console.log(`   Base URL: ${worker.baseUrl}`);

    // Test 1: Health endpoint
    console.log("   ✓ Testing health endpoint...");
    totalTests++;
    const healthResult = await testEndpoint(
      `${worker.baseUrl}${worker.healthPath}`
    );

    if (healthResult.ok && healthResult.hasRequestId) {
      console.log(
        `     ✅ Health OK (${healthResult.responseTime}ms, request-id present)`
      );
      passedTests++;
    } else {
      console.log(
        `     ❌ Health FAILED: ${healthResult.error || `Status ${healthResult.status}`}`
      );
    }

    results.push({
      worker: worker.name,
      test: "health",
      ...healthResult,
    });

    // Test 2: Auth/functional endpoint
    console.log("   ✓ Testing functional endpoint...");
    totalTests++;

    const authHeaders = {};
    let expectedStatus = 200;

    if (worker.authPath === "/status" && API_KEY) {
      authHeaders["x-api-key"] = API_KEY;
      expectedStatus = 200; // Or 403 if MCP blocks, but not 401
    }

    const authResult = await testEndpoint(
      `${worker.baseUrl}${worker.authPath}`,
      authHeaders,
      expectedStatus
    );

    if (authResult.ok) {
      console.log(`     ✅ Functional OK (${authResult.responseTime}ms)`);
      passedTests++;
    } else if (authResult.status === 403 && worker.authPath === "/status") {
      console.log(`     ⚠️  Status returned 403 (MCP blocking) - acceptable`);
      passedTests++; // 403 is acceptable for /status if MCP blocks
    } else {
      console.log(
        `     ❌ Functional FAILED: ${authResult.error || `Status ${authResult.status}`}`
      );
    }

    results.push({
      worker: worker.name,
      test: "functional",
      ...authResult,
    });
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log(`📊 SMOKE TEST SUMMARY`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(
    `   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
  );

  if (passedTests === totalTests) {
    console.log("\n✅ ALL SMOKE TESTS PASSED - Deployment looks healthy!");
  } else {
    console.log("\n❌ SOME TESTS FAILED - Check worker deployments");
  }

  console.log(`\nCompleted: ${new Date().toISOString()}`);

  // Export results for CI
  if (process.env.CI_RESULTS_FILE) {
    const fs = await import("fs");
    await fs.promises.writeFile(
      process.env.CI_RESULTS_FILE,
      JSON.stringify({ totalTests, passedTests, results }, null, 2)
    );
  }

  // Exit with error code if any tests failed
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Show usage if no base URLs configured
if (
  !process.env.ONBOARDING_BASE_URL &&
  !process.env.ORCHESTRATOR_BASE_URL &&
  !process.env.DOCS_BASE_URL
) {
  console.log(`
AtlasIT Deployment Smoke Tests

Environment Variables:
  ONBOARDING_BASE_URL    Base URL for onboarding worker
  ORCHESTRATOR_BASE_URL  Base URL for orchestrator worker  
  DOCS_BASE_URL          Base URL for documentation worker
  API_KEY                API key for authenticated endpoints
  CI_RESULTS_FILE        JSON file to write test results (optional)

Example usage:
  ORCHESTRATOR_BASE_URL=https://your-domain.workers.dev \\
  API_KEY=your-secret-key \\
  node scripts/deploy-smoke.mjs

Using default production URLs...
`);
}

smokeTest().catch((error) => {
  console.error("💥 Smoke test crashed:", error);
  process.exit(2);
});
