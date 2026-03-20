import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlertDispatcher } from "../alert-dispatcher.js";
import type { SLOCheckResult } from "../slo-monitor.js";

const NOW = "2026-03-20T12:00:00.000Z";

function makeResult(overrides: Partial<SLOCheckResult> = {}): SLOCheckResult {
  return {
    sloName: "api_availability",
    target: 0.999,
    currentRate: 0.97,
    budgetRemaining: 0.3,
    alerts: [
      {
        severity: "critical",
        burnRate: 14.4,
        actualBurnRate: 30,
        window: "5m/1h",
        message: "api_availability: critical burn rate exceeded (30x) in 5m/1h",
      },
    ],
    ...overrides,
  };
}

describe("AlertDispatcher", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("dispatch", () => {
    it("sends POST request to webhookUrl when there are alerts", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const sent = await dispatcher.dispatch(makeResult());

      expect(sent).toBe(true);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://hooks.example.com/alert");
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        "Content-Type": "application/json",
      });
    });

    it("returns false and does not fetch when result has no alerts", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const sent = await dispatcher.dispatch(makeResult({ alerts: [] }));

      expect(sent).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("payload body is valid JSON with required fields", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      await dispatcher.dispatch(makeResult());

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const payload = JSON.parse(init.body as string) as Record<
        string,
        unknown
      >;

      expect(payload).toHaveProperty("sloName", "api_availability");
      expect(payload).toHaveProperty("severity");
      expect(payload).toHaveProperty("burnRate");
      expect(payload).toHaveProperty("actualBurnRate");
      expect(payload).toHaveProperty("budgetRemaining");
      expect(payload).toHaveProperty("message");
      expect(payload).toHaveProperty("ts");
    });

    it("includes channel in payload when configured", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.slack.com/services/xxx",
        channel: "#sre-alerts",
      });
      await dispatcher.dispatch(makeResult());

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const payload = JSON.parse(init.body as string) as Record<
        string,
        unknown
      >;
      expect(payload).toHaveProperty("channel", "#sre-alerts");
    });

    it("suppresses duplicate alerts within dedup window", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
        minAlertIntervalMs: 300_000,
      });
      const result = makeResult();

      const first = await dispatcher.dispatch(result);
      const second = await dispatcher.dispatch(result);

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("re-sends after dedup window expires", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
        minAlertIntervalMs: 300_000,
      });
      const result = makeResult();

      const first = await dispatcher.dispatch(result);
      vi.advanceTimersByTime(300_001);
      const second = await dispatcher.dispatch(result);

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("tracks dedup per SLO name independently", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
        minAlertIntervalMs: 300_000,
      });
      const api = makeResult({ sloName: "api_availability" });
      const workflow = makeResult({ sloName: "workflow_execution_success" });

      const s1 = await dispatcher.dispatch(api);
      const s2 = await dispatcher.dispatch(workflow);
      const s3 = await dispatcher.dispatch(api); // suppressed

      expect(s1).toBe(true);
      expect(s2).toBe(true);
      expect(s3).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("uses 5-minute default dedup interval when minAlertIntervalMs not set", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const result = makeResult();

      await dispatcher.dispatch(result);
      vi.advanceTimersByTime(4 * 60 * 1000); // 4 min — still suppressed
      const suppressed = await dispatcher.dispatch(result);
      expect(suppressed).toBe(false);

      vi.advanceTimersByTime(60 * 1000 + 1); // cross 5 min boundary
      const sent = await dispatcher.dispatch(result);
      expect(sent).toBe(true);
    });

    it("returns false and does not throw when webhook returns non-2xx", async () => {
      fetchSpy.mockResolvedValue(new Response(null, { status: 500 }));
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const sent = await dispatcher.dispatch(makeResult());
      expect(sent).toBe(false);
    });

    it("returns false and does not throw when fetch rejects", async () => {
      fetchSpy.mockRejectedValue(new Error("network error"));
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const sent = await dispatcher.dispatch(makeResult());
      expect(sent).toBe(false);
    });

    it("picks highest-severity alert when multiple alerts present", async () => {
      const dispatcher = new AlertDispatcher({
        webhookUrl: "https://hooks.example.com/alert",
      });
      const result = makeResult({
        alerts: [
          {
            severity: "warning",
            burnRate: 6,
            actualBurnRate: 9,
            window: "30m/6h",
            message: "warn",
          },
          {
            severity: "critical",
            burnRate: 14.4,
            actualBurnRate: 30,
            window: "5m/1h",
            message: "crit",
          },
        ],
      });
      await dispatcher.dispatch(result);

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const payload = JSON.parse(init.body as string) as Record<
        string,
        unknown
      >;
      expect(payload).toHaveProperty("severity", "critical");
    });
  });
});
