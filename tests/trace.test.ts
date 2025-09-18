import { beforeEach, describe, expect, it, vi } from "vitest";
import { traceFetch, withSpan } from "../src/lib/trace";

const originalLog = console.log;

beforeEach(() => {
  console.log = originalLog;
});

describe("withSpan", () => {
  it("logs start and finish events", async () => {
    const logs = [];
    console.log = (message) => {
      logs.push(JSON.parse(message));
    };

    await withSpan("test-span", async (span) => {
      span.log("checkpoint", { step: 1 });
    });

    const events = logs.map((entry) => entry.event);
    expect(events).toContain("start");
    expect(events).toContain("checkpoint");
    expect(events).toContain("finish");
    const traceIds = new Set(logs.map((entry) => entry.traceId));
    expect(traceIds.size).toBe(1);
  });
});

describe("traceFetch", () => {
  it("wraps handler and preserves incoming trace id", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const traced = traceFetch(handler);
    const request = new Request("https://example.dev/api", {
      headers: {
        "x-trace-id": "trace-123",
      },
    });

    const response = await traced(request, {}, {});
    expect(handler).toHaveBeenCalled();
    expect(response.headers.get("x-trace-id")).toBe("trace-123");
  });

  it("generates new trace id and attaches span to context", async () => {
    let spanTraceId;
    const handler = vi.fn(async (req, env, ctx) => {
      spanTraceId = ctx.trace.traceId;
      return new Response("ok");
    });

    const traced = traceFetch(handler);
    const response = await traced(new Request("https://example.dev/foo"), {}, {});
    expect(handler).toHaveBeenCalled();
    expect(response.headers.get("x-trace-id")).toBe(spanTraceId);
    expect(typeof spanTraceId).toBe("string");
  });
});
