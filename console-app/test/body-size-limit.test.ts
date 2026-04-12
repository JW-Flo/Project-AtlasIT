/**
 * Tests for request body size limit enforcement.
 *
 * Exercises the `checkBodySizeLimit` and `parseBodySizeLimit` functions
 * exported from `$lib/server/body-size-limit` — the same code used by
 * `hooks.server.ts` — so tests cover the real production logic.
 *
 * Covers the BODY_SIZE_LIMIT bypass vulnerability fix: both the
 * Content-Length fast-path and the streaming byte-count path that
 * prevents Content-Length spoofing.
 */
import { describe, expect, it } from "vitest";
import {
  checkBodySizeLimit,
  parseBodySizeLimit,
} from "../src/lib/server/body-size-limit";

// ---------------------------------------------------------------------------
// parseBodySizeLimit
// ---------------------------------------------------------------------------

describe("parseBodySizeLimit", () => {
  const DEFAULT = 512 * 1024;

  it("returns default when env var is absent", () => {
    expect(parseBodySizeLimit(undefined, DEFAULT)).toBe(DEFAULT);
  });

  it("returns default when env var is non-numeric", () => {
    expect(parseBodySizeLimit("not-a-number", DEFAULT)).toBe(DEFAULT);
  });

  it("returns Infinity when env var is '0' (disables the limit)", () => {
    expect(parseBodySizeLimit("0", DEFAULT)).toBe(Infinity);
  });

  it("returns Infinity when env var is negative", () => {
    expect(parseBodySizeLimit("-1", DEFAULT)).toBe(Infinity);
  });

  it("returns parsed value for a valid positive integer", () => {
    expect(parseBodySizeLimit("1024", DEFAULT)).toBe(1024);
  });
});

// ---------------------------------------------------------------------------
// checkBodySizeLimit
// ---------------------------------------------------------------------------

describe("checkBodySizeLimit", () => {
  const LIMIT = 100; // tiny limit for tests

  it("allows GET requests without a body regardless of limit", async () => {
    const req = new Request("http://localhost/api/test", { method: "GET" });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(false);
  });

  it("allows POST requests within the limit", async () => {
    const body = new Uint8Array(50); // 50 bytes — under 100-byte limit
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      const buf = await result.request.arrayBuffer();
      expect(buf.byteLength).toBe(50);
    }
  });

  it("rejects POST requests that exceed the limit via Content-Length header", async () => {
    const body = new Uint8Array(200);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "200" },
      body,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.response.status).toBe(413);
      const json = await result.response.json();
      expect(json).toMatchObject({ code: "payload_too_large" });
    }
  });

  it("rejects POST requests that exceed the limit via actual bytes (spoofed Content-Length)", async () => {
    // Simulates Content-Length spoofing: header says 10 but real body is 200 bytes.
    const body = new Uint8Array(200);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-length": "10" }, // spoofed low value
      body,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects PUT requests exceeding the limit", async () => {
    const body = new Uint8Array(150);
    const req = new Request("http://localhost/api/test", {
      method: "PUT",
      body,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(true);
  });

  it("rejects PATCH requests exceeding the limit", async () => {
    const body = new Uint8Array(150);
    const req = new Request("http://localhost/api/test", {
      method: "PATCH",
      body,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(true);
  });

  it("allows POST requests without a body", async () => {
    const req = new Request("http://localhost/api/test", { method: "POST" });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(false);
  });

  it("reconstructed request body matches original bytes", async () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: original,
    });
    const result = await checkBodySizeLimit(req, LIMIT);
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      const buf = await result.request.arrayBuffer();
      expect(new Uint8Array(buf)).toEqual(original);
    }
  });

  it("allows large bodies when limit is Infinity (disabled)", async () => {
    const body = new Uint8Array(1_000_000); // 1 MB
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body,
    });
    const result = await checkBodySizeLimit(req, Infinity);
    expect(result.blocked).toBe(false);
  });
});

