import { describe, it, expect, vi, beforeEach } from "vitest";
import { signPayload } from "../packages/mcp-sdk/src/hmac";
import { buildApp } from "../slack-notification-agent/src/index";
import { formatEventMessage } from "../slack-notification-agent/src/formatters";

const TEST_SECRET = "test-agent-secret-for-slack-notifications";
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T00/B00/xxx";

// Mock global fetch for Slack webhook calls
const mockFetch = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
  // Default: Slack returns 200 OK
  mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", mockFetch);
});

function buildEventBody(
  type: string,
  payload?: Record<string, unknown>,
): string {
  return JSON.stringify({
    eventId: "evt-test-1",
    tenantId: "tenant-1",
    type,
    source: "ai-orchestrator",
    payload: payload ?? {},
    timestamp: "2026-03-15T10:00:00.000Z",
  });
}

describe("Slack Notification Agent", () => {
  describe("webhook handler", () => {
    it("receives event and sends Slack webhook", async () => {
      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const eventBody = buildEventBody("workflow.step.completed", {
        workflowName: "Deploy App",
        stepName: "Build Image",
      });
      const signature = await signPayload(eventBody, TEST_SECRET);

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Correlation-ID": "corr-1",
          "X-Event-ID": "evt-test-1",
        },
        body: eventBody,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("processed");

      // Verify Slack webhook was called
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe(SLACK_WEBHOOK_URL);
      expect(opts.method).toBe("POST");

      const slackPayload = JSON.parse(opts.body as string);
      expect(slackPayload.text).toContain("Build Image");
      expect(slackPayload.text).toContain("Deploy App");
      expect(slackPayload.blocks).toBeDefined();
    });

    it("rejects events without HMAC signature", async () => {
      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const res = await app.request("/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildEventBody("workflow.step.completed"),
      });

      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects events with invalid HMAC signature", async () => {
      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const res = await app.request("/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": "deadbeef".repeat(8),
        },
        body: buildEventBody("workflow.step.completed"),
      });

      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns 422 for unhandled event types", async () => {
      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const eventBody = buildEventBody("some.unknown.event");
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
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns 500 when Slack webhook fails", async () => {
      mockFetch.mockResolvedValue(
        new Response("channel_not_found", { status: 404 }),
      );

      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const eventBody = buildEventBody("incident.created", {
        title: "Database down",
        severity: "critical",
      });
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
      expect(body.error).toContain("Slack webhook failed");
    });
  });

  describe("health endpoint", () => {
    it("returns healthy status", async () => {
      const app = buildApp({
        AGENT_SECRET: TEST_SECRET,
        SLACK_WEBHOOK_URL,
      });

      const res = await app.request("/health", { method: "GET" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("healthy");
    });
  });

  describe("message formatting", () => {
    it("formats workflow.step.completed events", () => {
      const message = formatEventMessage({
        eventId: "evt-1",
        tenantId: "tenant-1",
        type: "workflow.step.completed",
        source: "orchestrator",
        payload: { workflowName: "Deploy", stepName: "Build" },
        timestamp: "2026-03-15T10:00:00Z",
      });

      expect(message.text).toContain("Build");
      expect(message.text).toContain("Deploy");
      expect(message.blocks).toBeDefined();
      expect(message.blocks!.length).toBeGreaterThanOrEqual(2);
      expect(message.blocks![0].text?.text).toContain("Completed");
    });

    it("formats workflow.step.failed events", () => {
      const message = formatEventMessage({
        eventId: "evt-1",
        tenantId: "tenant-1",
        type: "workflow.step.failed",
        source: "orchestrator",
        payload: {
          workflowName: "Deploy",
          stepName: "Build",
          error: "OOM killed",
        },
        timestamp: "2026-03-15T10:00:00Z",
      });

      expect(message.text).toContain("failed");
      expect(message.text).toContain("OOM killed");
      expect(message.blocks![0].text?.text).toContain("Failed");
    });

    it("formats incident.created events", () => {
      const message = formatEventMessage({
        eventId: "evt-1",
        tenantId: "tenant-1",
        type: "incident.created",
        source: "monitoring",
        payload: {
          title: "API Latency Spike",
          severity: "high",
          description: "p99 > 2s",
        },
        timestamp: "2026-03-15T10:00:00Z",
      });

      expect(message.text).toContain("API Latency Spike");
      expect(message.text).toContain("high");
      expect(message.blocks![0].text?.text).toContain("Incident");
    });

    it("formats approval.required events", () => {
      const message = formatEventMessage({
        eventId: "evt-1",
        tenantId: "tenant-1",
        type: "approval.required",
        source: "access-requests",
        payload: {
          requestType: "AWS Admin",
          requester: "alice@acme.co",
          details: "Production access",
        },
        timestamp: "2026-03-15T10:00:00Z",
      });

      expect(message.text).toContain("AWS Admin");
      expect(message.text).toContain("alice@acme.co");
      expect(message.blocks![0].text?.text).toContain("Approval");
    });

    it("formats unknown event types with a default layout", () => {
      const message = formatEventMessage({
        eventId: "evt-1",
        tenantId: "tenant-1",
        type: "custom.event",
        source: "external",
        timestamp: "2026-03-15T10:00:00Z",
      });

      expect(message.text).toContain("custom.event");
      expect(message.blocks![0].text?.text).toContain("custom.event");
    });
  });
});
