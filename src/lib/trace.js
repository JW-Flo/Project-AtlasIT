// Cloudflare Workers runtime provides crypto.randomUUID().
// Avoid node:crypto (not available without nodejs_compat) to keep bundle minimal.
function safeRandomUUID() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Minimal RFC4122 v4 fallback (not cryptographically strong, last resort only)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const OBS_EVENT_NAMESPACE = "atlasit.trace";

function logEvent(entry) {
  const payload = {
    ts: new Date().toISOString(),
    namespace: OBS_EVENT_NAMESPACE,
    ...entry,
  };
  console.log(JSON.stringify(payload));
}

function createSpanId() {
  return safeRandomUUID().replace(/-/g, "").slice(0, 16);
}

export function createTraceId() {
  return safeRandomUUID();
}

export async function withSpan(name, handler, options = {}) {
  const traceId = options.traceId || createTraceId();
  const spanId = createSpanId();
  const start = Date.now();

  const span = {
    name,
    traceId,
    spanId,
    parentId: options.parentId,
    attributes: { ...(options.attributes || {}) },
    log(event, data) {
      logEvent({ traceId, spanId, span: name, event, ...data });
    },
  };

  span.log("start", { attributes: span.attributes });

  try {
    const result = await handler(span);
    span.log("finish", { durationMs: Date.now() - start });
    return result;
  } catch (error) {
    span.log("error", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function traceFetch(handler, options = {}) {
  return async function tracedFetch(request, env, ctx) {
    const url = new URL(request.url);
    const existingTraceId =
      request.headers.get("x-trace-id") || options.traceId;
    const attributes = {
      method: request.method,
      path: url.pathname,
    };

    return withSpan(
      `${request.method} ${url.pathname}`,
      async (span) => {
        span.log("request", { attributes });
        const handlerCtx = ctx
          ? Object.assign(Object.create(Object.getPrototypeOf(ctx)), ctx, {
              trace: span,
            })
          : { trace: span };

        const response = await handler(request, env, handlerCtx);
        if (response?.headers?.set) {
          response.headers.set("x-trace-id", span.traceId);
        }
        span.log("response", {
          status: response?.status ?? 0,
        });
        return response;
      },
      {
        traceId: existingTraceId,
        attributes,
      },
    );
  };
}

export function traceLog(span, event, data) {
  span.log(event, data);
}
