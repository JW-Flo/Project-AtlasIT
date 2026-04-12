#!/usr/bin/env node
// Smoke test the compliance-packs endpoints with a real login
const API = "https://ahjoepuw96.execute-api.us-east-1.amazonaws.com";

async function j(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

console.log("1. Login as joe.whittle@atlasit.app");
const login = await j("POST", "/api/v1/auth/token", null, { email: "joe.whittle@atlasit.app", password: "AtlasIT2026!" });
console.log("   status:", login.status);
if (login.status !== 200) { console.log(login.json); process.exit(1); }
const token = login.json.token;
const tenantId = login.json.tenantId;
console.log("   tenant:", tenantId);

console.log("\n2. GET /api/v1/compliance-packs/registry/controls");
const reg = await j("GET", "/api/compliance/api/v1/compliance-packs/registry/controls", token);
console.log("   status:", reg.status, "total:", reg.json.data?.total);

console.log("\n3. GET /api/v1/compliance-packs (list + per-tenant install state)");
const list = await j("GET", "/api/compliance/api/v1/compliance-packs", token);
console.log("   status:", list.status);
for (const p of list.json.data?.items ?? []) {
  console.log(`   - ${p.id} (${p.framework}) controls=${p.controlCount} installed=${p.installedAt ? "yes" : "no"}`);
}

console.log("\n4. POST /install pack-soc2-builtin");
const install = await j("POST", "/api/compliance/api/v1/compliance-packs/pack-soc2-builtin/install", token);
console.log("   status:", install.status, install.json.data);

console.log("\n5. GET /api/v1/compliance-packs/pack-soc2-builtin (detail with controls)");
const detail = await j("GET", "/api/compliance/api/v1/compliance-packs/pack-soc2-builtin", token);
console.log("   status:", detail.status);
console.log("   pack:", detail.json.data?.pack?.name, "controls:", detail.json.data?.controls?.length);
console.log("   sample controls:", detail.json.data?.controls?.slice(0, 3).map((c) => `${c.controlId}=${c.state}`).join(", "));

console.log("\n6. POST /api/v1/compliance-packs/pack-soc2-builtin/evaluate");
const evalRes = await j("POST", "/api/compliance/api/v1/compliance-packs/pack-soc2-builtin/evaluate", token);
console.log("   status:", evalRes.status);
console.log("   result:", JSON.stringify(evalRes.json.data, null, 2));

console.log("\n7. GET /installed");
const installed = await j("GET", "/api/compliance/api/v1/compliance-packs/installed", token);
console.log("   status:", installed.status);
console.log("   installed packs:", installed.json.data?.items?.map((i) => `${i.id} pass=${i.passCount} fail=${i.failCount} unk=${i.unknownCount}`));

console.log("\nDone.");
