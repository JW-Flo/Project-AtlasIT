/**
 * Tests for request body size limit enforcement in hooks.server.ts.
 *
 * Covers the BODY_SIZE_LIMIT bypass vulnerability fix: both the
 * Content-Length fast-path and the streaming byte-count path that
 * prevents Content-Length spoofing.
 */
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Inline helpers that mirror the logic in hooks.server.ts so we can unit-test
// the enforcement algorithm without importing SvelteKit internals.
// ---------------------------------------------------------------------------

const BODY_SIZE_LIMIT_DEFAULT = 512 * 1024; // 512 KB
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function payloadTooLargeResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Payload too large", code: "payload_too_large" }),
    { status: 413, headers: { "content-type": "application/json" } },
  );
}

/**
 * Enforces body size limit on the given request.
 * Returns a 413 Response if the limit is exceeded, or null if the request
 * is within the allowed size.  A reconstructed Request (with a pre-read
 * body) is returned alongside null so downstream code can still read it.
 */
async function enforceBodySize(
  request: Request,
  limitBytes = BODY_SIZE_LIMIT_DEFAULT,
): Promise<{ response: Response } | { request: Request }> {
  if (!BODY_METHODS.has(request.method) || !request.body) {
    return { request };
  }

  // Fast path
  const clHeader = parseInt(request.headers.get("content-length") ?? "", 10);
  if (!isNaN(clHeader) && clHeader > limitBytes) {
    return { response: payloadTooLargeResponse() };
  }

  // Streaming path
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let oversized = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limitBytes) {
        oversized = true;
        await reader.cancel().catch(() => undefined);
        break;
      }
      chunks.push(value);
    }
  } catch {
    // stream error – propagate to route handler
  }

  if (oversized) {
    return { response: payloadTooLargeResponse() };
  }

  const assembled = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    assembled.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { request: new Request(request, { body: assembled }) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("body size limit enforcement", () => {
  const LIMIT = 100; // tiny limit for tests

  it("allows GET requests without a body regardless of limit", async () => {
    const req = new Request("http://localhost/api/test", { method: "GET" });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(false);
  });

  it("allows POST requests within the limit", async () => {
    const body = new Uint8Array(50); // 50 bytes — under 100-byte limit
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: body,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(false);
    if ("request" in result) {
      // Body should still be readable
      const buf = await result.request.arrayBuffer();
      expect(buf.byteLength).toBe(50);
    }
  });

  it("rejects POST requests that exceed the limit via Content-Length header", async () => {
    const body = new Uint8Array(200); // 200 bytes
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "200" },
      body: body,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(413);
      const json = await result.response.json();
      expect(json).toMatchObject({ code: "payload_too_large" });
    }
  });

  it("rejects POST requests that exceed the limit via actual bytes (spoofed Content-Length)", async () => {
    // Simulates Content-Length spoofing: header says 10 but real body is 200 bytes
    const body = new Uint8Array(200);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "10" }, // spoofed small value
      body: body,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects PUT requests exceeding the limit", async () => {
    const body = new Uint8Array(150);
    const req = new Request("http://localhost/api/test", {
      method: "PUT",
      body: body,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects PATCH requests exceeding the limit", async () => {
    const body = new Uint8Array(150);
    const req = new Request("http://localhost/api/test", {
      method: "PATCH",
      body: body,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(true);
  });

  it("allows POST requests without a body", async () => {
    const req = new Request("http://localhost/api/test", { method: "POST" });
    const result = await enforceBodySize(req, LIMIT);
    expect("response" in result).toBe(false);
  });

  it("reconstructed request body matches original bytes", async () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: original,
    });
    const result = await enforceBodySize(req, LIMIT);
    expect("request" in result).toBe(true);
    if ("request" in result) {
      const buf = await result.request.arrayBuffer();
      expect(new Uint8Array(buf)).toEqual(original);
    }
  });
});
