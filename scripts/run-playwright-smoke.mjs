#!/usr/bin/env node
import { spawn } from "child_process";
import http from "http";

const PORT = parseInt(process.env.PORT || "8787", 10);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;
const DEV_CMD = process.env.SMOKE_DEV_CMD || "npm run dev:console";
const START_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1000;

function waitForPort(url, timeout = START_TIMEOUT_MS) {
  const deadline = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline)
          return reject(new Error("Timeout waiting for app"));
        setTimeout(attempt, POLL_INTERVAL_MS);
      });
    };
    attempt();
  });
}

async function main() {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    console.log(`[smoke] Starting dev server via: ${DEV_CMD}`);
    const child = spawn(DEV_CMD, { shell: true, stdio: "inherit" });
    let closed = false;
    child.on("exit", (code) => {
      closed = true;
      if (code !== 0)
        console.error(`[smoke] Dev server exited with code ${code}`);
    });
    try {
      await waitForPort(BASE_URL);
      console.log(`[smoke] Server reachable at ${BASE_URL}`);
    } catch (err) {
      console.error("[smoke] Failed to start server", err);
      child.kill("SIGTERM");
      process.exit(1);
    }
    // Run Playwright
    const pw = spawn("npx playwright test --reporter=line", {
      shell: true,
      stdio: "inherit",
      env: { ...process.env, PLAYWRIGHT_BASE_URL: BASE_URL },
    });
    pw.on("exit", (code) => {
      if (!closed) child.kill("SIGTERM");
      process.exit(code || 0);
    });
  } else {
    console.log(
      "[smoke] Using externally provided PLAYWRIGHT_BASE_URL:",
      BASE_URL
    );
    const pw = spawn("npx playwright test --reporter=line", {
      shell: true,
      stdio: "inherit",
    });
    pw.on("exit", (code) => process.exit(code || 0));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
