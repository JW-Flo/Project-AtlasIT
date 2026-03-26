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
export declare function extractTraceContext(request: Request): CFTraceContext;
/**
 * Create a traceparent header value for outgoing requests.
 */
export declare function toTraceparent(ctx: CFTraceContext): string;
/**
 * Create a child span context (same trace, new span).
 */
export declare function childSpan(parent: CFTraceContext): CFTraceContext;
/**
 * Timing helper — wraps an async operation and emits a structured log
 * with trace context and duration.
 */
export declare function traceSpan<T>(
  ctx: CFTraceContext,
  spanName: string,
  fn: () => Promise<T>,
): Promise<T>;
//# sourceMappingURL=cf-tracer.d.ts.map
