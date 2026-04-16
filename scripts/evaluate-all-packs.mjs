#!/usr/bin/env node
const API = "https://ahjoepuw96.execute-api.us-east-1.amazonaws.com";
async function j(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
const login = await j("POST", "/api/v1/auth/token", null, { email: "joe.whittle@atlasit.app", password: "AtlasIT2026!" });
const token = login.json.token;
console.log("Logged in as", login.json.email, "tenant=", login.json.tenantId);

const packs = ["pack-soc2-builtin", "pack-iso27001-builtin", "pack-nist-csf-builtin", "pack-hipaa-builtin", "pack-gdpr-builtin"];
for (const packId of packs) {
  await j("POST", `/api/compliance/api/v1/compliance-packs/${packId}/install`, token);
  const r = await j("POST", `/api/compliance/api/v1/compliance-packs/${packId}/evaluate`, token);
  const d = r.json.data ?? {};
  console.log(`${packId}: ${d.passCount ?? "?"} pass, ${d.failCount ?? "?"} fail, ${d.unknownCount ?? "?"} unknown (score ${d.score ?? "?"}%) — ${d.durationMs}ms`);
}
