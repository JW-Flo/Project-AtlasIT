import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createAgentHandler,
  type AgentHandlerConfig,
} from "../../packages/mcp-sdk/src/handler";
import { signPayload } from "../../packages/mcp-sdk/src/hmac";

const TEST_SECRET = "test-secret-for-mcp-sdk-handler";

function buildConfig(
  overrides?: Partial<AgentHandlerConfig>,
): AgentHandlerConfig {
  return {
    secret: TEST_SECRET,
    agentId: "agent-1",
    agentName: "test-agent",
    handlers: {},
    ...overrides,
  };
}

function buildEventBody(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    eventId: "evt-1",
    tenantId: "tenant-1",
    type: "user.created",
    source: "core-api",
    payload: { userId: "u-1" },
    timestamp: new Date().toISOString(),
    ...overrides,
  });
}

describe("MCP SDK handler integration", () => {
  describe("createAgentHandler", () => {
    it("creates Hono app with /health and /webhook", () => {
      const config = buildConfig();
      const app = createAgentHandler(config);

      // Hono app should exist and have routes
      expect(app).toBeDefined();
      expect(typeof app.request).toBe("function");
    });
  });

  describe("GET /health", () => {
    it("returns healthy status", async () => {
      const app = createAgentHandler(buildConfig());
      const res = await app.request("/health", { method: "GET" });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("healthy");
      expect(body.timestamp).toBeDefined();
    });

    it("returns custom health check result when provided", async () => {
      const app = createAgentHandler(
        buildConfig({
          healthCheck: async () => ({
            status: "degraded",
            timestamp: new Date().toISOString(),
            details: { db: "slow" },
          }),
        }),
      );

      const res = await app.request("/health", { method: "GET" });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("degraded");
      expect(body.details.db).toBe("slow");
    });
  });

  describe("POST /webhook", () => {
    it("rejects missing signature", async () => {
      const app = createAgentHandler(buildConfig());

      const res = await app.request("/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildEventBody(),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Missing signature");
    });

    it("rejects invalid signature", async () => {
      const app = createAgentHandler(buildConfig());

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": "invalid-signature-value",
        },
        body: buildEventBody(),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid signature");
    });

    it("dispatches to correct event handler", async () => {
      const userCreatedHandler = vi.fn().mockResolvedValue(undefined);
      const userUpdatedHandler = vi.fn().mockResolvedValue(undefined);

      const app = createAgentHandler(
        buildConfig({
          handlers: {
            "user.created": userCreatedHandler,
            "user.updated": userUpdatedHandler,
          },
        }),
      );

      const eventBody = buildEventBody({ type: "user.created" });
      const signature = await signPayload(eventBody, TEST_SECRET);

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Correlation-ID": "corr-1",
          "X-Event-ID": "evt-1",
        },
        body: eventBody,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("processed");

      expect(userCreatedHandler).toHaveBeenCalledOnce();
      expect(userUpdatedHandler).not.toHaveBeenCalled();

      // Verify handler received correct arguments
      const [event, context] = userCreatedHandler.mock.calls[0];
      expect(event.type).toBe("user.created");
      expect(event.tenantId).toBe("tenant-1");
      expect(context.correlationId).toBe("corr-1");
      expect(context.agentId).toBe("agent-1");
      expect(context.agentName).toBe("test-agent");
    });

    it("dispatches to wildcard handler when specific handler not found", async () => {
      const wildcardHandler = vi.fn().mockResolvedValue(undefined);

      const app = createAgentHandler(
        buildConfig({
          handlers: {
            "*": wildcardHandler,
          },
        }),
      );

      const eventBody = buildEventBody({ type: "some.unknown.event" });
      const signature = await signPayload(eventBody, TEST_SECRET);

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
        },
        body: eventBody,
      });

      expect(res.status).toBe(200);
      expect(wildcardHandler).toHaveBeenCalledOnce();
    });

    it("returns 422 for unhandled event type", async () => {
      const app = createAgentHandler(
        buildConfig({
          handlers: {
            "user.created": vi.fn(),
          },
        }),
      );

      const eventBody = buildEventBody({ type: "order.placed" });
      const signature = await signPayload(eventBody, TEST_SECRET);

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
        },
        body: eventBody,
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain("No handler for event type");
      expect(body.error).toContain("order.placed");
    });

    it("returns 500 when handler throws", async () => {
      const failingHandler = vi
        .fn()
        .mockRejectedValue(new Error("Handler crashed"));

      const app = createAgentHandler(
        buildConfig({
          handlers: {
            "user.created": failingHandler,
          },
        }),
      );

      const eventBody = buildEventBody({ type: "user.created" });
      const signature = await signPayload(eventBody, TEST_SECRET);

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
        },
        body: eventBody,
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Handler crashed");
    });
  });
});
