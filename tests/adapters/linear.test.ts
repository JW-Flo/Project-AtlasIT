import { describe, it, expect, beforeEach, vi } from "vitest";
import { createAdapter } from "../../adapters/linear/index.js";
import type { AdapterContext } from "../../adapters/linear/types.js";

describe("Linear Adapter", () => {
  let adapter: ReturnType<typeof createAdapter>;
  let mockKV: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock KV store
    mockKV = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    };

    const context: AdapterContext = {
      env: {
        LINEAR_API_KEY: "test-api-key",
        LINEAR_WEBHOOK_SECRET: "test-secret",
      },
      bindings: {
        KV_CACHE: mockKV,
      },
    };

    adapter = createAdapter(context);
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const request = new Request("https://example.com/health");
      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        status: "ok",
        name: "linear",
        version: "1.0.0",
      });
      expect(data.endpoints).toContain("/webhook");
      expect(data.endpoints).toContain("/sync");
      expect(data.endpoints).toContain("/issues");
      expect(data.features.webhookHandling).toBe(true);
      expect(data.features.dataSync).toBe(true);
      expect(data.features.issueTracking).toBe(true);
    });

    it("should include adapter metadata in headers", async () => {
      const request = new Request("https://example.com/health");
      const response = await adapter.fetch(request);

      expect(response.headers.get("x-adapter")).toBe("linear");
      expect(response.headers.get("x-feature-flag")).toBe(
        "FEATURE_CONNECTOR_LINEAR",
      );
      expect(response.headers.get("content-type")).toBe("application/json");
    });
  });

  describe("Webhook Handler", () => {
    it("should process issue creation webhook", async () => {
      const webhookPayload = {
        action: "create",
        type: "Issue",
        data: {
          id: "issue-123",
          title: "Test Issue",
          description: "Test description",
          createdAt: "2025-11-05T08:13:39.333Z",
          updatedAt: "2025-11-05T08:13:39.333Z",
        },
        createdAt: "2025-11-05T08:13:39.333Z",
      };

      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "linear-signature": "mock-signature",
        },
        body: JSON.stringify(webhookPayload),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data.processed).toBe(true);

      // Verify KV was called to store the issue
      expect(mockKV.put).toHaveBeenCalled();
    });

    it("should process issue update webhook", async () => {
      const webhookPayload = {
        action: "update",
        type: "Issue",
        data: {
          id: "issue-123",
          title: "Updated Issue",
          description: "Updated description",
          createdAt: "2025-11-05T08:13:39.333Z",
          updatedAt: "2025-11-05T08:14:00.000Z",
        },
        createdAt: "2025-11-05T08:14:00.000Z",
      };

      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "linear-signature": "mock-signature",
        },
        body: JSON.stringify(webhookPayload),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);
      expect(mockKV.put).toHaveBeenCalled();
    });

    it("should process issue removal webhook", async () => {
      const webhookPayload = {
        action: "remove",
        type: "Issue",
        data: {
          id: "issue-123",
        },
        createdAt: "2025-11-05T08:15:00.000Z",
      };

      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "linear-signature": "mock-signature",
        },
        body: JSON.stringify(webhookPayload),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);
      expect(mockKV.delete).toHaveBeenCalled();
    });

    it("should reject webhook without signature when secret is configured", async () => {
      const webhookPayload = {
        action: "create",
        type: "Issue",
        data: { id: "issue-123" },
        createdAt: "2025-11-05T08:13:39.333Z",
      };

      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Missing webhook signature");
    });

    it("should handle comment events", async () => {
      const webhookPayload = {
        action: "create",
        type: "Comment",
        data: {
          id: "comment-123",
          body: "Test comment",
          issueId: "issue-123",
        },
        createdAt: "2025-11-05T08:13:39.333Z",
      };

      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "linear-signature": "mock-signature",
        },
        body: JSON.stringify(webhookPayload),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);
      expect(mockKV.put).toHaveBeenCalled();
    });
  });

  describe("Sync Handler", () => {
    it("should initiate sync with default parameters", async () => {
      const request = new Request("https://example.com/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data.sync.direction).toBe("linear-to-atlas");
      expect(data.sync.entityTypes).toEqual(["issues"]);
      expect(data.sync.initiated).toBe(true);
    });

    it("should initiate sync with custom parameters", async () => {
      const request = new Request("https://example.com/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          direction: "bidirectional",
          entityTypes: ["issues", "comments", "labels"],
        }),
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.sync.direction).toBe("bidirectional");
      expect(data.sync.entityTypes).toEqual(["issues", "comments", "labels"]);
    });
  });

  describe("Issues Handler", () => {
    it("should list synchronized issues", async () => {
      mockKV.list.mockResolvedValue({
        keys: [
          { name: "linear:issue:issue-1" },
          { name: "linear:issue:issue-2" },
        ],
      });

      mockKV.get
        .mockResolvedValueOnce(
          JSON.stringify({
            id: "issue-1",
            title: "First Issue",
            createdAt: "2025-11-05T08:13:39.333Z",
          }),
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            id: "issue-2",
            title: "Second Issue",
            createdAt: "2025-11-05T08:14:00.000Z",
          }),
        );

      const request = new Request("https://example.com/issues", {
        method: "GET",
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.count).toBe(2);
      expect(data.issues).toHaveLength(2);
      expect(data.issues[0].id).toBe("issue-1");
      expect(data.issues[1].id).toBe("issue-2");
    });

    it("should handle empty issue list", async () => {
      mockKV.list.mockResolvedValue({
        keys: [],
      });

      const request = new Request("https://example.com/issues", {
        method: "GET",
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.count).toBe(0);
      expect(data.issues).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const request = new Request("https://example.com/unknown", {
        method: "GET",
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe("Route not found");
    });

    it("should handle malformed webhook payload", async () => {
      const request = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "linear-signature": "mock-signature",
        },
        body: "invalid json",
      });

      const response = await adapter.fetch(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe("Failed to process webhook");
    });
  });
});
