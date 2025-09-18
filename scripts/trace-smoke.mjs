#!/usr/bin/env node
import { traceFetch, withSpan } from "../src/lib/trace.js";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const logs = [];
const originalLog = console.log;
console.log = (line) => {
  logs.push(line);
  originalLog(line);
};

async function run() {
  await withSpan("trace.smoke", async (span) => {
    span.log("checkpoint", { step: "start" });
    span.log("checkpoint", { step: "finish" });
  });

  const handler = async () => new Response("ok", { status: 200 });
  const traced = traceFetch(handler);
  await traced(new Request("https://atlasit.dev/trace-smoke"), {}, {});

  const dir = path.resolve("artifacts/obs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "trace-smoke.log"), `${logs.join("\n")}\n`, "utf8");
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log = originalLog;
  });
