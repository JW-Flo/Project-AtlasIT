#!/usr/bin/env node
import { traceFetch, withSpan } from "../src/lib/trace.js";
import { writeArtifact } from "../src/lib/artifacts.js";

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

  await writeArtifact("obs", "trace-smoke.log", `${logs.join("\n")}\n`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log = originalLog;
  });
