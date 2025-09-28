#!/usr/bin/env node
import http from "node:http";

const BASE = process.env.CONSOLE_URL || "http://localhost:5173";

const endpoints = [
  { path: "/", expect: 307, note: "root redirect" },
  { path: "/console", expect: 200, contains: "AtlasIT Console" },
  {
    path: "/api/health",
    expect: 200,
    json: true,
    fields: ["status", "version", "commit", "timestamp"],
  },
  {
    path: "/api/mock/compliance/snapshot",
    expect: 200,
    json: true,
    fields: ["generatedAt", "frameworkSummary", "risks", "policies"],
  },
];

function request(path) {
  return new Promise((resolve) => {
    const req = http.request(BASE + path, { method: "GET" }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: data })
      );
    });
    req.on("error", (err) => resolve({ error: err }));
    req.end();
  });
}

async function main() {
  const results = [];
  for (const ep of endpoints) {
    const r = await request(ep.path);
    const record = { path: ep.path, ok: true, status: r.status };
    if (r.error) {
      record.ok = false;
      record.error = r.error.message;
      results.push(record);
      continue;
    }
    if (r.status !== ep.expect) {
      record.ok = false;
      record.mismatch = `expected ${ep.expect}`;
    }
    if (ep.json && r.status === ep.expect) {
      try {
        const parsed = JSON.parse(r.body);
        record.bodySummary = Object.keys(parsed);
        if (ep.fields) {
          for (const f of ep.fields) {
            if (!(f in parsed)) {
              record.ok = false;
              record.missingField = f;
              break;
            }
          }
        }
      } catch (e) {
        record.ok = false;
        record.parseError = e.message;
      }
    } else if (ep.contains) {
      if (!r.body.includes(ep.contains)) {
        record.ok = false;
        record.missingText = ep.contains;
      }
    }
    results.push(record);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(
    JSON.stringify(
      {
        base: BASE,
        results,
        failed: failed.length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
