import { describe, it, expect, vi, afterEach } from "vitest";
import { publishEvent } from "./event-publisher.js";
import { verifySignature } from "../../../packages/shared/src/crypto/hmac.js";

const ORCHESTRATOR_URL = "https://orchestrator.atlasit.pro";
const TENANT_ID = "tenant-abc";
const SECRET = "test-hmac-secret-32-chars-long!!";

function makeFetchStub(status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ data: { id: "evt-1", status: "queued" } }),
    text: async () => "error body",
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("publishEvent — HMAC signing", () => {
  it("attaches X-Signature when secret is provided", async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    await publishEvent({
      orchestratorUrl: ORCHESTRATOR_URL,
      tenantId: TENANT_ID,
      type: "compliance.evidence.collected",
      source: "adapter:github",
      secret: SECRET,
    });

    const [, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Signature"]).toBeDefined();
    expect(typeof headers["X-Signature"]).toBe("string");
    expect(headers["X-Signature"].length).toBe(64); // SHA-256 hex = 64 chars
  });

  it("X-Signature is a valid HMAC of the serialised request body", async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    await publishEvent({
      orchestratorUrl: ORCHESTRATOR_URL,
      tenantId: TENANT_ID,
      type: "directory.synced",
      source: "adapter:github",
      payload: { users: { total: 5 } },
      correlationId: "corr-123",
      secret: SECRET,
    });

    const [, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;

    const isValid = await verifySignature(body, headers["X-Signature"], SECRET);
    expect(isValid).toBe(true);
  });

  it("omits X-Signature when no secret is provided", async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    await publishEvent({
      orchestratorUrl: ORCHESTRATOR_URL,
      tenantId: TENANT_ID,
      type: "directory.synced",
      source: "adapter:github",
    });

    const [, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Signature"]).toBeUndefined();
  });

  it("includes X-Correlation-ID when correlationId is provided", async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    await publishEvent({
      orchestratorUrl: ORCHESTRATOR_URL,
      tenantId: TENANT_ID,
      type: "test.event",
      source: "adapter:github",
      correlationId: "corr-xyz",
      secret: SECRET,
    });

    const [, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Correlation-ID"]).toBe("corr-xyz");
  });

  it("throws when orchestrator returns non-OK status", async () => {
    const fetchStub = makeFetchStub(500);
    vi.stubGlobal("fetch", fetchStub);

    await expect(
      publishEvent({
        orchestratorUrl: ORCHESTRATOR_URL,
        tenantId: TENANT_ID,
        type: "test.event",
        source: "adapter:github",
        secret: SECRET,
      }),
    ).rejects.toThrow("Event publish failed (500)");
  });

  it("posts to the correct orchestrator events endpoint", async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    await publishEvent({
      orchestratorUrl: ORCHESTRATOR_URL,
      tenantId: TENANT_ID,
      type: "test.event",
      source: "adapter:github",
    });

    const [url] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${ORCHESTRATOR_URL}/api/v1/events`);
  });
});
