import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractTraceContext,
  toTraceparent,
  childSpan,
  traceSpan,
} from "../packages/shared/src/observability/cf-tracer";
import {
  CFMetricsEmitter,
  createCFMetrics,
} from "../packages/shared/src/observability/cf-metrics";
import type { AnalyticsEngineDataset } from "../packages/shared/src/observability/cf-metrics";

describe("CF Tracer", () => {
  describe("extractTraceContext", () => {
    it("extracts W3C traceparent header", () => {
      const traceId = "0af7651916cd43dd8448eb211c80319c";
      const parentId = "b7ad6b7169203331";
      const req = new Request("https://example.com", {
        headers: {
          traceparent: `00-${traceId}-${parentId}-01`,
        },
      });

      const ctx = extractTraceContext(req);
      expect(ctx.traceId).toBe(traceId);
      expect(ctx.parentSpanId).toBe(parentId);
      expect(ctx.sampled).toBe(true);
      expect(ctx.spanId).toHaveLength(16); // 8 bytes hex
    });

    it("uses X-Correlation-ID when no traceparent", () => {
      const correlationId = "abc123def456";
      const req = new Request("https://example.com", {
        headers: { "X-Correlation-ID": correlationId },
      });

      const ctx = extractTraceContext(req);
      expect(ctx.traceId).toBe(correlationId);
      expect(ctx.parentSpanId).toBeUndefined();
      expect(ctx.sampled).toBe(true);
    });

    it("generates new trace ID when no headers present", () => {
      const req = new Request("https://example.com");
      const ctx = extractTraceContext(req);
      expect(ctx.traceId).toBeDefined();
      expect(ctx.traceId.length).toBeGreaterThan(0);
      expect(ctx.spanId).toHaveLength(16);
    });

    it("handles unsampled traceparent", () => {
      const req = new Request("https://example.com", {
        headers: {
          traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00",
        },
      });

      const ctx = extractTraceContext(req);
      expect(ctx.sampled).toBe(false);
    });
  });

  describe("toTraceparent", () => {
    it("creates valid W3C traceparent string", () => {
      const ctx = {
        traceId: "0af7651916cd43dd8448eb211c80319c",
        spanId: "b7ad6b7169203331",
        sampled: true,
      };

      const header = toTraceparent(ctx);
      expect(header).toBe(
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      );
    });

    it("sets trace flags to 00 when not sampled", () => {
      const ctx = {
        traceId: "abc123",
        spanId: "def456",
        sampled: false,
      };

      expect(toTraceparent(ctx)).toContain("-00");
    });
  });

  describe("childSpan", () => {
    it("creates a child with same trace ID and new span ID", () => {
      const parent = {
        traceId: "trace-123",
        spanId: "parent-span",
        sampled: true,
      };

      const child = childSpan(parent);
      expect(child.traceId).toBe("trace-123");
      expect(child.spanId).not.toBe("parent-span");
      expect(child.parentSpanId).toBe("parent-span");
      expect(child.sampled).toBe(true);
    });
  });

  describe("traceSpan", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns the result of the traced function", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const ctx = {
        traceId: "trace-1",
        spanId: "span-1",
        sampled: true,
      };

      const result = await traceSpan(ctx, "test-op", async () => 42);
      expect(result).toBe(42);

      // Should have logged a finish event
      expect(consoleSpy).toHaveBeenCalledOnce();
      const logArg = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(logArg.event).toBe("finish");
      expect(logArg.span).toBe("test-op");
      expect(logArg.traceId).toBe("trace-1");
      expect(logArg.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("logs error and re-throws on failure", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      const ctx = {
        traceId: "trace-2",
        spanId: "span-2",
        sampled: true,
      };

      await expect(
        traceSpan(ctx, "failing-op", async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      expect(consoleSpy).toHaveBeenCalledOnce();
      const logArg = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(logArg.event).toBe("error");
      expect(logArg.error).toBe("boom");
    });
  });
});

describe("CF Metrics", () => {
  describe("CFMetricsEmitter", () => {
    it("buffers metrics and flushes to Analytics Engine", () => {
      const writeDataPoint = vi.fn();
      const dataset: AnalyticsEngineDataset = { writeDataPoint };

      const metrics = new CFMetricsEmitter("core-api", "production", dataset);
      metrics.increment("request_count", { route: "/health" });
      metrics.record("response_time_ms", 42, { route: "/health", status: "200" });

      expect(writeDataPoint).not.toHaveBeenCalled();
      metrics.flush();

      expect(writeDataPoint).toHaveBeenCalledTimes(2);

      // First call: request_count
      const call1 = writeDataPoint.mock.calls[0][0];
      expect(call1.blobs[0]).toBe("request_count");
      expect(call1.blobs[1]).toBe("core-api");
      expect(call1.blobs[2]).toBe("production");
      expect(call1.doubles[0]).toBe(1);
      expect(call1.indexes[0]).toBe("request_count");

      // Second call: response_time_ms
      const call2 = writeDataPoint.mock.calls[1][0];
      expect(call2.doubles[0]).toBe(42);
    });

    it("falls back to console.log when no dataset provided", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const metrics = new CFMetricsEmitter("core-api", "dev");
      metrics.increment("request_count");
      metrics.flush();

      expect(consoleSpy).toHaveBeenCalledOnce();
      const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(logged._metric).toBe(true);
      expect(logged.name).toBe("request_count");
      expect(logged.value).toBe(1);
      expect(logged.service).toBe("core-api");
      consoleSpy.mockRestore();
    });

    it("clears buffer after flush", () => {
      const writeDataPoint = vi.fn();
      const dataset: AnalyticsEngineDataset = { writeDataPoint };
      const metrics = new CFMetricsEmitter("test", "dev", dataset);

      metrics.increment("a");
      metrics.flush();
      expect(writeDataPoint).toHaveBeenCalledTimes(1);

      metrics.flush();
      expect(writeDataPoint).toHaveBeenCalledTimes(1); // No new writes
    });

    it("recordLatency adds standard tags", () => {
      const writeDataPoint = vi.fn();
      const dataset: AnalyticsEngineDataset = { writeDataPoint };
      const metrics = new CFMetricsEmitter("api", "prod", dataset);

      metrics.recordLatency("/api/v1/tenants", "GET", 200, 15);
      metrics.flush();

      const call = writeDataPoint.mock.calls[0][0];
      expect(call.blobs[0]).toBe("http_request_duration_ms");
      expect(call.doubles[0]).toBe(15);
      // Tags should include route, method, status
      const tagBlobs = call.blobs.slice(3);
      expect(tagBlobs).toContain("route=/api/v1/tenants");
      expect(tagBlobs).toContain("method=GET");
      expect(tagBlobs).toContain("status=200");
    });
  });

  describe("createCFMetrics", () => {
    it("creates an emitter with service and environment", () => {
      const metrics = createCFMetrics("compliance", "staging");
      expect(metrics).toBeInstanceOf(CFMetricsEmitter);
    });
  });
});
