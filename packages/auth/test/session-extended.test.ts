import { describe, it, expect } from "vitest";
import { createSessionStore } from "../src/session";

// Simple user fixture
const user = { id: "u1", email: "u1@example.com", tenantId: "t1" } as any;

describe("Session store extended operations", () => {
  const store = createSessionStore({});
  it("creates session and validates isActive()", async () => {
    const { id, refreshToken, session } = await store.create(user, {
      ttlSeconds: 60,
    });
    expect(id).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(store.isActive(session)).toBe(true);
  });

  it("rotateRefreshToken invalid id returns null", async () => {
    const rotated = await store.rotateRefreshToken("nope");
    expect(rotated).toBeNull();
  });

  it("rotateRefreshToken updates refresh token and invalidates cache", async () => {
    const { id } = await store.create(user, { ttlSeconds: 60 });
    const first = await store.rotateRefreshToken(id);
    const second = await store.rotateRefreshToken(id);
    expect(first?.refreshToken).toBeTruthy();
    expect(second?.refreshToken).toBeTruthy();
    expect(first?.refreshToken).not.toBe(second?.refreshToken);
  });

  it("revoke marks session inactive", async () => {
    const { id } = await store.create(user, { ttlSeconds: 60 });
    const s1 = await store.get(id);
    expect(store.isActive(s1)).toBe(true);
    const revoked = await store.revoke(id);
    expect(revoked).toBe(true);
    const s2 = await store.get(id); // reload from DB
    expect(store.isActive(s2)).toBe(false);
  });
});
