import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt } from "@atlasit/shared/crypto/jwt";
import type { JwtPayload } from "@atlasit/shared/crypto/jwt";

describe("JWT - HS256", () => {
  const secret = "test-jwt-secret-for-unit-tests-only";

  it("signs and verifies a valid token", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      iss: "atlasit",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      email: "test@example.com",
    };

    const token = await signJwt(payload, secret);
    expect(token.split(".")).toHaveLength(3);

    const decoded = await verifyJwt(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe("user-123");
    expect(decoded!.email).toBe("test@example.com");
  });

  it("rejects token signed with wrong secret", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signJwt(payload, secret);
    const decoded = await verifyJwt(token, "wrong-secret");
    expect(decoded).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) - 60, // expired 1 min ago
      iat: Math.floor(Date.now() / 1000) - 3600,
    };

    const token = await signJwt(payload, secret);
    const decoded = await verifyJwt(token, secret);
    expect(decoded).toBeNull();
  });

  it("rejects tampered tokens", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signJwt(payload, secret);
    // Tamper with the payload
    const parts = token.split(".");
    parts[1] = parts[1] + "x";
    const tampered = parts.join(".");
    const decoded = await verifyJwt(tampered, secret);
    expect(decoded).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyJwt("not-a-jwt", secret)).toBeNull();
    expect(await verifyJwt("", secret)).toBeNull();
    expect(await verifyJwt("a.b", secret)).toBeNull();
  });

  it("preserves custom claims", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      tenantId: "tenant-abc",
      roles: ["admin", "owner"],
      mfaVerified: true,
    };

    const token = await signJwt(payload, secret);
    const decoded = await verifyJwt(token, secret);
    expect(decoded!.tenantId).toBe("tenant-abc");
    expect(decoded!.roles).toEqual(["admin", "owner"]);
    expect(decoded!.mfaVerified).toBe(true);
  });
});
