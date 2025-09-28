import { describe, it, expect } from "vitest";
import orchestrator, { handleRequest } from "../ai-orchestrator/index.js";

// Minimal env mock
const mockEnv: any = {};

async function call(method: string, path: string, body?: any) {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) init.body = JSON.stringify(body);
  const req = new Request(`https://example.com${path}`, init);
  // Prefer exported handleRequest to ensure named export works; fall back to default.fetch
  const resp = await (handleRequest
    ? handleRequest(req, mockEnv, {} as any)
    : orchestrator.fetch(req, mockEnv, {} as any));
  const text = await resp.text();
  let json: any = undefined;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: resp.status, json, raw: text };
}

describe("Orchestrator worker basic endpoints", () => {
  it("GET /health returns healthy status", async () => {
    const res = await call("GET", "/health");
    expect(res.status).toBe(200);
    expect(res.json.status).toBe("healthy");
    expect(res.json.service).toBe("orchestrator");
    // New R2 metrics appended (non-breaking). Validate shape minimally.
    expect(res.json).toHaveProperty("r2");
    if (res.json.r2) {
      ["atlas_policies", "atlas_evidence", "atlas_artifacts"].forEach((k) => {
        expect(res.json.r2).toHaveProperty(k);
      });
    }
  });

  it("GET /status returns structure (may be MCP rejected)", async () => {
    const res = await call("GET", "/status");
    // Either 200 with fields or 403 if MCP rejection; accept both for now since MCP endpoint not stubbed
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.json).toHaveProperty("pendingTasks");
      expect(res.json).toHaveProperty("activeDeployments");
    }
  });
});
