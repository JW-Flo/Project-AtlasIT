import { json } from '@sveltejs/kit';

const rateLimitMap = /* @__PURE__ */ new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 6e4;
function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}
const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ ok: true });
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ ok: true });
  }
  const rateLimitKey = `error-log:tenant:${tenantId}`;
  if (!checkRateLimit(rateLimitKey)) {
    return json({ ok: true });
  }
  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0");
    if (contentLength > 10240) {
      return json({ ok: true }, { status: 413 });
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return json({ ok: true });
    }
    const sanitizedMetadata = { ...body.metadata };
    delete sanitizedMetadata.componentStack;
    delete sanitizedMetadata.stack;
    delete sanitizedMetadata.error;
    let sanitizedUrl;
    if (body.url) {
      try {
        const url = new URL(body.url);
        sanitizedUrl = url.pathname;
      } catch {
        sanitizedUrl = void 0;
      }
    }
    const logEntry = {
      level: "error",
      source: "client",
      tenantId,
      userId: user.id,
      type: body.type || "unknown",
      message: body.message || "Unknown error",
      httpStatus: body.httpStatus,
      url: sanitizedUrl,
      timestamp: body.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      metadata: sanitizedMetadata
    };
    console.error(JSON.stringify(logEntry));
    return json({ ok: true });
  } catch (error) {
    return json({ ok: true });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-BVgPtq98.js.map
