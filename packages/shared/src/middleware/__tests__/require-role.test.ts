import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requireRole } from "../auth";

/**
 * Unit tests for the hierarchical requireRole middleware.
 * Role hierarchy: viewer(0) < member(1) < admin(2)
 */

function createApp(userRoles: string[]) {
  const app = new Hono();

  app.onError((err, c) => {
    const status = "status" in err ? (err as any).status : 500;
    return c.json({ status: "error", message: err.message }, status as any);
  });

  // Simulate auth middleware setting auth context
  app.use("*", async (c, next) => {
    c.set("auth", {
      tenantId: "t1",
      userId: "u1",
      email: "test@test.com",
      roles: userRoles,
      tokenType: "jwt",
    } as any);
    await next();
  });

  app.get("/viewer", requireRole("viewer"), (c) => c.json({ ok: true }));
  app.get("/member", requireRole("member"), (c) => c.json({ ok: true }));
  app.get("/admin", requireRole("admin"), (c) => c.json({ ok: true }));

  return app;
}

describe("requireRole", () => {
  describe("viewer user", () => {
    const app = createApp(["viewer"]);

    it("should allow access to viewer routes", async () => {
      const res = await app.request("/viewer");
      expect(res.status).toBe(200);
    });

    it("should deny access to member routes", async () => {
      const res = await app.request("/member");
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.message).toBe("Insufficient role: requires member");
    });

    it("should deny access to admin routes", async () => {
      const res = await app.request("/admin");
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.message).toBe("Insufficient role: requires admin");
    });
  });

  describe("member user", () => {
    const app = createApp(["member"]);

    it("should allow access to viewer routes", async () => {
      const res = await app.request("/viewer");
      expect(res.status).toBe(200);
    });

    it("should allow access to member routes", async () => {
      const res = await app.request("/member");
      expect(res.status).toBe(200);
    });

    it("should deny access to admin routes", async () => {
      const res = await app.request("/admin");
      expect(res.status).toBe(403);
    });
  });

  describe("admin user", () => {
    const app = createApp(["admin"]);

    it("should allow access to viewer routes", async () => {
      const res = await app.request("/viewer");
      expect(res.status).toBe(200);
    });

    it("should allow access to member routes", async () => {
      const res = await app.request("/member");
      expect(res.status).toBe(200);
    });

    it("should allow access to admin routes", async () => {
      const res = await app.request("/admin");
      expect(res.status).toBe(200);
    });
  });

  describe("unknown role", () => {
    const app = createApp(["api-key"]);

    it("should deny access to viewer routes for unknown role", async () => {
      const res = await app.request("/viewer");
      expect(res.status).toBe(403);
    });

    it("should deny access to member routes for unknown role", async () => {
      const res = await app.request("/member");
      expect(res.status).toBe(403);
    });
  });

  describe("no auth context", () => {
    it("should return 401 when auth is not set", async () => {
      const app = new Hono();
      app.onError((err, c) => {
        const status = "status" in err ? (err as any).status : 500;
        return c.json({ status: "error", message: err.message }, status as any);
      });
      app.get("/protected", requireRole("member"), (c) => c.json({ ok: true }));

      const res = await app.request("/protected");
      expect(res.status).toBe(401);
    });
  });

  describe("multiple roles", () => {
    const app = createApp(["viewer", "admin"]);

    it("should use highest role in hierarchy", async () => {
      const res = await app.request("/admin");
      expect(res.status).toBe(200);
    });
  });
});
