import { describe, it, expect } from "vitest";
import {
  signPayload,
  verifySignature,
} from "../../ai-orchestrator/src/lib/hmac";

describe("HMAC signing and verification", () => {
  const secret = "test-secret-key-for-hmac-signing";
  const payload = JSON.stringify({
    eventId: "evt-1",
    type: "user.created",
    tenantId: "t-1",
  });

  it("signPayload generates consistent hex signature", async () => {
    const sig1 = await signPayload(payload, secret);
    const sig2 = await signPayload(payload, secret);

    expect(sig1).toBe(sig2);
    // SHA-256 HMAC produces 32 bytes = 64 hex chars
    expect(sig1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifySignature returns true for valid signature", async () => {
    const signature = await signPayload(payload, secret);
    const result = await verifySignature(payload, signature, secret);

    expect(result).toBe(true);
  });

  it("verifySignature returns false for tampered payload", async () => {
    const signature = await signPayload(payload, secret);
    const tampered = payload.replace("evt-1", "evt-tampered");
    const result = await verifySignature(tampered, signature, secret);

    expect(result).toBe(false);
  });

  it("verifySignature returns false for wrong secret", async () => {
    const signature = await signPayload(payload, secret);
    const result = await verifySignature(payload, signature, "wrong-secret");

    expect(result).toBe(false);
  });

  it("verifySignature returns false for truncated signature", async () => {
    const signature = await signPayload(payload, secret);
    const truncated = signature.slice(0, 32);
    const result = await verifySignature(payload, truncated, secret);

    expect(result).toBe(false);
  });

  it("constant-time comparison prevents timing attacks (lengths must match before comparison)", async () => {
    const signature = await signPayload(payload, secret);

    // Different length triggers early return (length check before constant-time loop)
    const shortSig = signature.slice(0, 10);
    const resultShort = await verifySignature(payload, shortSig, secret);
    expect(resultShort).toBe(false);

    // Same length but wrong content goes through full constant-time comparison
    const wrongSameLength = "a".repeat(signature.length);
    const resultWrong = await verifySignature(payload, wrongSameLength, secret);
    expect(resultWrong).toBe(false);

    // Correct signature passes
    const resultCorrect = await verifySignature(payload, signature, secret);
    expect(resultCorrect).toBe(true);
  });
});
