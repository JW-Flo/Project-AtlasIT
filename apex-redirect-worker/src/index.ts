// NOTE: Standalone worker without local tsconfig reference; eslint project parsing disabled via inline comment.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function buildHeaders(additional: Record<string, string> = {}) {
  return new Headers({ ...SECURITY_HEADERS, ...additional });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === "www.atlasit.pro") {
      return new Response(null, { status: 204, headers: buildHeaders() });
    }

    if (host === "atlasit.pro") {
      url.hostname = "www.atlasit.pro";
      return new Response(null, {
        status: 301,
        headers: buildHeaders({ Location: url.toString() }),
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: buildHeaders({ "content-type": "text/plain; charset=utf-8" }),
    });
  },
};
