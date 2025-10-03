#!/usr/bin/env node
/* Minimal test harness for core worker endpoints */
import assert from "node:assert/strict";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function logResult(ok, name, detail) {
  const symbol = ok ? "✅" : "❌";
  console.log(`${symbol} ${name}${detail ? " - " + detail : ""}`);
}

const results = [];

async function loadCoreWorker() {
  const mod = await import(path.join(root, "index.js"));
  if (!mod || !mod.default || typeof mod.default.fetch !== "function") {
    throw new Error("Core worker export missing fetch");
  }
  return mod.default;
}

function mockEnv(extra = {}) {
  return { ADMIN_TOKEN: "secret-admin-token", ...extra };
}

async function jsonFetch(worker, req, env) {
  const res = await worker.fetch(req, env, {});
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { res, body };
}

async function testAppsFlow(worker) {
  const env = mockEnv();
  // 1 list
  let { res, body } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps"),
    env
  );
  assert.equal(res.status, 200, "list status 200");
  assert.ok(Array.isArray(body.applications), "applications array");
  const first = body.applications[0];
  assert.ok(first && "id" in first, "application has id");
  const targetId = first.id;

  // 2 connect
  ({ res, body } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps/connect", {
      method: "POST",
      body: JSON.stringify({ id: targetId }),
    }),
    env
  ));
  assert.equal(res.status, 200, "connect 200");
  assert.equal(body.connected, true, "connected true");

  // 3 status reflects connect
  ({ res, body } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps/status"),
    env
  ));
  assert.equal(res.status, 200, "status 200");
  const statusEntry = body.applications.find((a) => a.id === targetId);
  assert.equal(statusEntry.connected, true, "status shows connected");

  // 4 sync not connected error path (choose fabricated id) should 400
  ({ res } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps/sync", {
      method: "POST",
      body: JSON.stringify({ id: "__nonexistent__" }),
    }),
    env
  ));
  assert.equal(res.status, 400, "sync non-connected 400");

  // 5 sync success
  ({ res, body } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps/sync", {
      method: "POST",
      body: JSON.stringify({ id: targetId }),
    }),
    env
  ));
  assert.equal(res.status, 202, "sync accepted");
  assert.ok(body.syncId, "syncId present");

  // 6 disconnect
  ({ res, body } = await jsonFetch(
    worker,
    new Request("http://local/api/v1/apps/disconnect", {
      method: "POST",
      body: JSON.stringify({ id: targetId }),
    }),
    env
  ));
  assert.equal(res.status, 200, "disconnect 200");
  assert.equal(body.connected, false, "disconnected");
}

async function testAdminLogs(worker) {
  const env = mockEnv();
  // Emit logs: health twice + one app list
  await worker.fetch(new Request("http://local/health"), env, {});
  await worker.fetch(new Request("http://local/health"), env, {});
  await worker.fetch(new Request("http://local/api/v1/apps"), env, {});

  // Unauthorized access
  let res = await worker.fetch(
    new Request("http://local/api/v1/admin/logs/recent"),
    env,
    {}
  );
  assert.equal(res.status, 401, "unauthorized without bearer");

  // Add a sensitive log by calling apps connect with redaction-worthy payload (email + token)
  const connectReq = new Request("http://local/api/v1/apps/connect", {
    method: "POST",
    body: JSON.stringify({
      id: "dummy-app",
      email: "user@example.com",
      token: "secret-token-value",
    }),
  });
  await worker.fetch(connectReq, env, {});

  // Authorized fetch
  res = await worker.fetch(
    new Request("http://local/api/v1/admin/logs/recent?limit=5", {
      headers: { authorization: "Bearer secret-admin-token" },
    }),
    env,
    {}
  );
  let body = JSON.parse(await res.text());
  assert.equal(res.status, 200, "authorized logs 200");
  assert.ok(Array.isArray(body.logs), "logs array present");
  assert.ok(body.logs.length <= 5, "limit respected");
  const redactionCandidate = body.logs.find(
    (l) => l.event && l.event.startsWith("apps.")
  );
  if (redactionCandidate) {
    const meta = redactionCandidate.meta || {};
    if (meta.email)
      assert.ok(/\*\*\*@/.test(meta.email), "email partially redacted");
    if (meta.token) assert.equal(meta.token, "[REDACTED]", "token redacted");
  }

  // Level filter (likely none are error, ensure returns subset)
  const errorRes = await worker.fetch(
    new Request("http://local/api/v1/admin/logs/recent?level=error", {
      headers: { authorization: "Bearer secret-admin-token" },
    }),
    env,
    {}
  );
  const errorBody = JSON.parse(await errorRes.text());
  assert.equal(errorRes.status, 200, "error filter 200");
  if (errorBody.logs.length) {
    for (const l of errorBody.logs)
      assert.equal(l.level, "error", "filtered to error");
  }
}

async function run() {
  const worker = await loadCoreWorker();
  const testCases = [
    ["apps flow", testAppsFlow],
    ["admin logs", testAdminLogs],
  ];
  for (const [name, fn] of testCases) {
    try {
      await fn(worker);
      logResult(true, name);
      results.push({ name, ok: true });
    } catch (e) {
      logResult(false, name, e.message);
      results.push({ name, ok: false, error: e });
    }
  }
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nSummary: ${results.length - failed.length}/${results.length} passed`
  );
  if (failed.length) {
    process.exitCode = 1;
  }
}

run();
