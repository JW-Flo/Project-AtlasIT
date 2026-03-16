/**
 * Cloudflare Workers-native request tracing.
 *
 * Uses request-scoped trace/span IDs propagated via headers.
 * Compatible with W3C Trace Context (traceparent header).
 */

export interface CFTraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

/**
 * Extract or generate trace context from an incoming request.
 * Supports W3C traceparent header format:
 *   {version}-{trace-id}-{parent-id}-{trace-flags}
 */
export function extractTraceContext(request: Request): CFTraceContext {
  const traceparent = request.headers.get("traceparent");
  if (traceparent) {
    const parts = traceparent.split("-");
    if (parts.length === 4) {
      return {
        traceId: parts[1],
        spanId: generateSpanId(),
        parentSpanId: parts[2],
        sampled: parts[3] === "01",
      };
    }
  }

  // Fall back to X-Correlation-ID or generate new
  const correlationId =
    request.headers.get("X-Correlation-ID") ?? crypto.randomUUID().replace(/-/g, "");

  return {
    traceId: correlationId,
    spanId: generateSpanId(),
    sampled: true,
  };
}

/**
 * Create a traceparent header value for outgoing requests.
 */
export function toTraceparent(ctx: CFTraceContext): string {
  const flags = ctx.sampled ? "01" : "00";
  return `00-${ctx.traceId}-${ctx.spanId}-${flags}`;
}

/**
 * Create a child span context (same trace, new span).
 */
export function childSpan(parent: CFTraceContext): CFTraceContext {
  return {
    traceId: parent.traceId,
    spanId: generateSpanId(),
    parentSpanId: parent.spanId,
    sampled: parent.sampled,
  };
}

function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Timing helper — wraps an async operation and emits a structured log
 * with trace context and duration.
 */
export async function traceSpan<T>(
  ctx: CFTraceContext,
  spanName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const span = childSpan(ctx);
  const start = performance.now();

  const logEntry = {
    ts: new Date().toISOString(),
    namespace: "atlasit.trace",
    traceId: span.traceId,
    spanId: span.spanId,
    ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
    span: spanName,
  };

  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    console.log(
      JSON.stringify({ ...logEntry, event: "finish", durationMs }),
    );
    return result;
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    console.error(
      JSON.stringify({
        ...logEntry,
        event: "error",
        durationMs,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    throw err;
  }
}
