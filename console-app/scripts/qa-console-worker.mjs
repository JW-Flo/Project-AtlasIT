#!/usr/bin/env node
/**
 * Worker-level QA: imports built Cloudflare worker bundle and invokes fetch.
 * Requires prior `npm run build`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(
  __dirname,
  "../.svelte-kit/cloudflare/_worker.js"
);

async function loadWorker() {
  const mod = await import(workerPath + "?cacheBust=" + Date.now());
  if (!mod || !mod.default || typeof mod.default.fetch !== "function") {
    throw new Error("Worker export with fetch handler not found");
  }
  return mod.default;
}

function makeRequest(url) {
  return new Request("http://internal" + url, { method: "GET" });
}

async function run() {
  const failures = [];
  const worker = await loadWorker();
  const tests = [
    {
      path: "/api/health",
      validate: async (res) => {
        const data = await res.json();
        if (data.status !== "ok") throw new Error("status not ok");
      },
    },
    {
      path: "/api/mock/compliance/snapshot",
      validate: async (res) => {
        const data = await res.json();
        if (!Array.isArray(data.frameworkSummary))
          throw new Error("frameworkSummary missing");
      },
    },
    {
      path: "/console",
      validate: async (res) => {
        const text = await res.text();
        if (!text.toLowerCase().includes("atlasit console"))
          throw new Error("console page missing text");
      },
    },
    {
      path: "/",
      validate: async (res) => {
        if (res.status !== 307 && res.status !== 308) {
          const body = await res.text();
          if (!body.toLowerCase().includes("atlasit console"))
            throw new Error("root not redirecting & content mismatch");
        }
      },
    },
  ];

  for (const t of tests) {
    const start = Date.now();
    try {
      const response = await worker.fetch(makeRequest(t.path), {
        waitUntil: () => {},
      });
      if (!response) throw new Error("no response");
      if (t.validate) await t.validate(response.clone());
      console.log(`✔ ${t.path} ${response.status} ${Date.now() - start}ms`);
    } catch (e) {
      console.error(`✖ ${t.path} ${e.message}`);
      failures.push(t.path);
    }
  }

  if (failures.length) {
    console.error(`FAIL: ${failures.length} failing endpoint(s)`);
    process.exit(1);
  } else {
    console.log("PASS: all endpoints validated at worker level");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
