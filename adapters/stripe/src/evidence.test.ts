import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

const TENANT_ID = "tenant-test-123";

// Helper to build a test request
function makeRequest(body: Record<string, unknown> = { tenantId: TENANT_ID }) {
  return new Request("https://stripe-adapter.test/api/evidence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer internal-secret",
    },
    body: JSON.stringify(body),
  });
}

// Helper to build mock Stripe API responses
function makeMockStripe() {
  return {
    balance: {
      retrieve: vi.fn().mockResolvedValue({
        available: [
          { amount: 1000000, currency: "usd" },
          { amount: 500000, currency: "eur" },
        ],
        pending: [],
      }),
    },
    webhookEndpoints: {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            id: "we_1",
            url: "https://example.com/webhook",
            status: "enabled",
            enabled_events: ["payment_intent.succeeded", "charge.failed"],
          },
        ],
      }),
    },
    events: {
      list: vi.fn().mockResolvedValue({
        data: [
          { id: "evt_1", type: "payment_intent.succeeded", created: 1234567890 },
          { id: "evt_2", type: "charge.failed", created: 1234567891 },
          { id: "evt_3", type: "payment_intent.succeeded", created: 1234567892 },
        ],
      }),
    },
    disputes: {
      list: vi.fn().mockResolvedValue({
        data: [{ id: "dp_1", status: "won", created: 1234567890, amount: 1000, currency: "usd" }],
      }),
    },
  };
}

// Mock Stripe SDK module
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation((apiKey: string, config: unknown) => {
      return (global as { mockStripe?: unknown }).mockStripe;
    }),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (global as { mockStripe?: unknown }).mockStripe;
});

describe("POST /api/evidence", () => {
  describe("response shape", () => {
    it("returns items array with correct types and controlRefs", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);

      const types = (data.items as Array<{ type: string }>).map((i) => i.type);
      expect(types).toContain("api_key_permissions");
      expect(types).toContain("webhook_security");
      expect(types).toContain("payment_events");
      expect(types).toContain("dispute_tracking");
      expect(types).toContain("pci_compliance");
    });

    it("includes correct controlRefs for each evidence type", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; controlRefs: string[] }> };

      const apiKeyItem = data.items.find((i) => i.type === "api_key_permissions");
      expect(apiKeyItem?.controlRefs).toEqual(["SOC2-CC6.1"]);

      const webhookItem = data.items.find((i) => i.type === "webhook_security");
      expect(webhookItem?.controlRefs).toEqual(["SOC2-CC6.6"]);

      const paymentItem = data.items.find((i) => i.type === "payment_events");
      expect(paymentItem?.controlRefs).toEqual(["SOC2-CC7.2", "PCI-10.2"]);

      const disputeItem = data.items.find((i) => i.type === "dispute_tracking");
      expect(disputeItem?.controlRefs).toEqual(["SOC2-CC7.3"]);

      const pciItem = data.items.find((i) => i.type === "pci_compliance");
      expect(pciItem?.controlRefs).toEqual(["PCI-12.8"]);
    });
  });

  describe("api_key_permissions", () => {
    it("returns pass when API key is valid", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "api_key_permissions");
      expect(item?.status).toBe("pass");
    });

    it("detects live vs test key mode", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_live_5678",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as {
        items: Array<{ type: string; status: string; details: { keyMode: string } }>;
      };
      const item = data.items.find((i) => i.type === "api_key_permissions");
      expect(item?.details?.keyMode).toBe("live");
    });

    it("returns unknown when balance fetch fails", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.balance.retrieve.mockRejectedValue(new Error("Invalid API key"));
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "api_key_permissions");
      expect(item?.status).toBe("unknown");
    });
  });

  describe("webhook_security", () => {
    it("returns pass when all webhooks use HTTPS and are enabled", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "webhook_security");
      expect(item?.status).toBe("pass");
    });

    it("returns fail when webhook uses HTTP", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.webhookEndpoints.list.mockResolvedValue({
        data: [
          {
            id: "we_1",
            url: "http://insecure.com/webhook",
            status: "enabled",
            enabled_events: ["payment_intent.succeeded"],
          },
        ],
      });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "webhook_security");
      expect(item?.status).toBe("fail");
    });

    it("returns fail when webhook is disabled", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.webhookEndpoints.list.mockResolvedValue({
        data: [
          {
            id: "we_1",
            url: "https://example.com/webhook",
            status: "disabled",
            enabled_events: ["payment_intent.succeeded"],
          },
        ],
      });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "webhook_security");
      expect(item?.status).toBe("fail");
    });

    it("returns unknown when no webhooks configured", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.webhookEndpoints.list.mockResolvedValue({ data: [] });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "webhook_security");
      expect(item?.status).toBe("unknown");
    });
  });

  describe("payment_events", () => {
    it("returns pass when payment events are present", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "payment_events");
      expect(item?.status).toBe("pass");
    });

    it("returns unknown when no payment events in period", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.events.list.mockResolvedValue({ data: [] });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "payment_events");
      expect(item?.status).toBe("unknown");
    });
  });

  describe("dispute_tracking", () => {
    it("returns pass when all disputes are closed", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "dispute_tracking");
      expect(item?.status).toBe("pass");
    });

    it("returns fail when open disputes require response", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.disputes.list.mockResolvedValue({
        data: [
          {
            id: "dp_1",
            status: "needs_response",
            created: 1234567890,
            amount: 1000,
            currency: "usd",
          },
          { id: "dp_2", status: "won", created: 1234567891, amount: 500, currency: "usd" },
        ],
      });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "dispute_tracking");
      expect(item?.status).toBe("fail");
    });

    it("returns pass when no disputes in period", async () => {
      const mockStripe = makeMockStripe();
      mockStripe.disputes.list.mockResolvedValue({ data: [] });
      (global as { mockStripe?: unknown }).mockStripe = mockStripe;

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "dispute_tracking");
      expect(item?.status).toBe("pass");
    });
  });

  describe("pci_compliance", () => {
    it("always returns pass with Stripe PCI attestation", async () => {
      (global as { mockStripe?: unknown }).mockStripe = makeMockStripe();

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      const data = (await res.json()) as { items: Array<{ type: string; status: string }> };
      const item = data.items.find((i) => i.type === "pci_compliance");
      expect(item?.status).toBe("pass");
    });
  });

  describe("missing credentials", () => {
    it("returns empty items when STRIPE_SECRET_KEY is not set", async () => {
      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });

    it("returns empty items when no tenantId provided", async () => {
      const res = await app.fetch(makeRequest({}), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });
  });

  describe("Stripe API errors", () => {
    it("returns empty items when Stripe SDK initialization fails", async () => {
      // Mock Stripe constructor to throw
      vi.doMock("stripe", () => {
        return {
          default: vi.fn().mockImplementation(() => {
            throw new Error("Stripe initialization failed");
          }),
        };
      });

      const res = await app.fetch(makeRequest(), {
        DB: {} as D1Database,
        ADAPTER_SECRET: "secret",
        ORCHESTRATOR_URL: "https://orchestrator.test",
        ADAPTER_NAME: "stripe",
        STRIPE_SECRET_KEY: "sk_test_1234",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: unknown[] };
      expect(data.items).toEqual([]);
    });
  });
});
