import { describe, it, expect } from "vitest";
import {
  generateTotpSecret,
  generateTotpUri,
  generateTotp,
  verifyTotp,
  generateRecoveryCodes,
  base32Encode,
  base32Decode,
} from "@atlasit/shared/crypto/totp";

describe("TOTP - Base32 encoding", () => {
  it("round-trips random bytes through base32", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    const encoded = base32Encode(bytes);
    const decoded = base32Decode(encoded);
    expect(decoded).toEqual(bytes);
  });

  it("encodes known values correctly", () => {
    // "Hello!" = 0x48656C6C6F21
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21]);
    const encoded = base32Encode(bytes);
    expect(encoded).toBe("JBSWY3DPEE");
  });

  it("decodes with padding and lowercase", () => {
    const decoded = base32Decode("jbswy3dpee======");
    expect(decoded).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21]));
  });
});

describe("TOTP - Secret generation", () => {
  it("generates a 20-byte secret encoded as base32", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    const decoded = base32Decode(secret);
    expect(decoded.length).toBe(20);
  });

  it("generates unique secrets", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
  });
});

describe("TOTP - URI generation", () => {
  it("generates otpauth URI with correct format", () => {
    const uri = generateTotpUri("JBSWY3DPEHPK3PXP", "user@example.com", "AtlasIT");
    expect(uri).toBe(
      "otpauth://totp/AtlasIT:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=AtlasIT&algorithm=SHA1&digits=6&period=30",
    );
  });

  it("escapes special characters in issuer", () => {
    const uri = generateTotpUri("SECRET", "user@test.com", "My App: Test");
    expect(uri).toContain("issuer=My+App%3A+Test");
  });
});

describe("TOTP - Code generation and verification", () => {
  const testSecret = "JBSWY3DPEHPK3PXP"; // well-known test vector

  it("generates a 6-digit code", async () => {
    const code = await generateTotp(testSecret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates the same code for the same time window", async () => {
    const now = Math.floor(Date.now() / 1000);
    const a = await generateTotp(testSecret, now);
    const b = await generateTotp(testSecret, now);
    expect(a).toBe(b);
  });

  it("verifies a valid code", async () => {
    const now = Math.floor(Date.now() / 1000);
    const code = await generateTotp(testSecret, now);
    const result = await verifyTotp(testSecret, code, now);
    expect(result.valid).toBe(true);
  });

  it("accepts codes within the time window (1 step drift)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const pastCode = await generateTotp(testSecret, now - 30);
    const result = await verifyTotp(testSecret, pastCode, now);
    expect(result.valid).toBe(true);
  });

  it("rejects codes outside the window", async () => {
    const now = Math.floor(Date.now() / 1000);
    const farPast = await generateTotp(testSecret, now - 90);
    const result = await verifyTotp(testSecret, farPast, now);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid code format", async () => {
    const result = await verifyTotp(testSecret, "abc123");
    expect(result.valid).toBe(false);
  });

  it("rejects empty code", async () => {
    const result = await verifyTotp(testSecret, "");
    expect(result.valid).toBe(false);
  });

  // RFC 6238 test vector: SHA1, time = 59, step = 30 → counter = 1
  it("matches RFC 6238 test vector for time=59", async () => {
    // RFC 6238 Appendix B uses ASCII "12345678901234567890" as the shared secret.
    // Its base32 encoding is a well-known public test value (not a real credential).
    const rfcTestSecret = base32Encode(new TextEncoder().encode("12345678901234567890"));
    const code = await generateTotp(rfcTestSecret, 59);
    // RFC 6238 Appendix B: TOTP for SHA1 at T=59 is 287082
    expect(code).toBe("287082");
  });
});

describe("TOTP - Recovery codes", () => {
  it("generates the requested number of codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
  });

  it("generates codes in XXXX-XXXX format", () => {
    const codes = generateRecoveryCodes(4);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    }
  });

  it("generates unique codes", () => {
    const codes = generateRecoveryCodes(10);
    const unique = new Set(codes);
    expect(unique.size).toBe(10);
  });
});
