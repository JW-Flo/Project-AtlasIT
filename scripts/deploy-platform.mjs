#!/usr/bin/env node
/**
 * Platform Deployment Orchestrator
 *
 * Sequence:
 * 1. OpenAPI verification
 * 2. Build shared packages (if workspace script present)
 * 3. Build & deploy compliance worker (placeholder command)
 * 4. Build & deploy console (SvelteKit -> Cloudflare)
 * 5. Post-deploy smoke (curl config + snapshot)
 *
 * Environment expectations (export before running):
 *  - COMPLIANCE_WORKER_DIR (path to compliance worker)
 *  - CONSOLE_DIR (path to console-app) default ./console-app
 *  - COMPLIANCE_DEPLOY_CMD (override deploy command, e.g. "wrangler deploy")
 *  - CONSOLE_DEPLOY_CMD (override, e.g. "wrangler deploy")
 *  - CONSOLE_PUBLIC_URL (base URL for post-deploy smoke)
 */
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

function run(cmd, opts = {}) {
  console.log(`\n› ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function ensure(p, desc) {
  if (!fs.existsSync(p)) throw new Error(`Missing ${desc}: ${p}`);
}

async function main() {
  const root = process.cwd();
  // 1. OpenAPI verify
  if (fs.existsSync(path.join(root, "scripts", "openapi-verify.mjs"))) {
    run("node scripts/openapi-verify.mjs");
  } else {
    console.warn("openapi-verify script not found, skipping");
  }

  // 2. Build shared (optional)
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  );
  if (pkg.scripts && pkg.scripts["build:shared"]) {
    run("npm run build:shared");
  }

  // 3. Compliance worker deploy
  const complianceDir =
    process.env.COMPLIANCE_WORKER_DIR || path.join(root, "compliance-worker");
  if (fs.existsSync(complianceDir)) {
    if (fs.existsSync(path.join(complianceDir, "wrangler.toml"))) {
      const cmd = process.env.COMPLIANCE_DEPLOY_CMD || "npx wrangler deploy";
      run(cmd, { cwd: complianceDir });
    } else {
      console.warn(
        "wrangler.toml not found in compliance worker dir, skipping deploy"
      );
    }
  } else {
    console.warn("Compliance worker directory not found; skipping");
  }

  // 4. Console build + deploy (expects wrangler for Cloudflare Pages/Workers binding)
  const consoleDir = process.env.CONSOLE_DIR || path.join(root, "console-app");
  ensure(consoleDir, "console app dir");
  if (fs.existsSync(path.join(consoleDir, "package.json"))) {
    run("npm install --no-fund --no-audit", { cwd: consoleDir });
    if (fs.existsSync(path.join(consoleDir, "vite.config.ts"))) {
      run("npm run build", { cwd: consoleDir });
    }
    const consoleDeploy = process.env.CONSOLE_DEPLOY_CMD;
    if (consoleDeploy) {
      run(consoleDeploy, { cwd: consoleDir });
    } else {
      console.log(
        "No CONSOLE_DEPLOY_CMD provided; build artifact ready for manual deploy."
      );
    }
  }

  // 5. Post-deploy smoke (best effort)
  const smokeUrl = process.env.CONSOLE_PUBLIC_URL;
  if (smokeUrl) {
    try {
      run(`curl -sf ${smokeUrl}/api/config | jq -r .complianceBase`);
      run(`curl -sf ${smokeUrl}/api/config`);
      run(
        `curl -sf "${smokeUrl}$(curl -sf ${smokeUrl}/api/config | jq -r .complianceBase)/snapshot" | head -c 200`
      );
    } catch (e) {
      console.warn("Smoke checks failed (non-fatal)", e.message);
    }
  } else {
    console.log("CONSOLE_PUBLIC_URL not set; skipping smoke checks");
  }

  console.log("\nDeployment orchestrator complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
