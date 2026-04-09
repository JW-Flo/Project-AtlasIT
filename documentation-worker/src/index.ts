/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
// Side-effect import for generated worker types
import "../worker-configuration.d.ts";

const DOCS_KEY = "docs:document";
const MAX_DOCS_BYTES = 64 * 1024;

type WorkerEnv = {
  DOCS?: KVNamespace;
  DOCS_KV?: KVNamespace;
};

function getDocsStore(env: WorkerEnv): KVNamespace | null {
  return env.DOCS ?? env.DOCS_KV ?? null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAndValidateDocument(
  bodyText: string,
): { valid: true; document: Record<string, unknown> } | { valid: false; error: string } {
  if (bodyText.length === 0) {
    return { valid: false, error: "Request body must not be empty" };
  }

  if (bodyText.length > MAX_DOCS_BYTES) {
    return { valid: false, error: "Payload too large" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return { valid: false, error: "Invalid JSON payload" };
  }

  if (!isPlainObject(payload)) {
    return { valid: false, error: "Payload must be a JSON object" };
  }

  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_DOCS_BYTES) {
    return { valid: false, error: "Payload too large" };
  }

  return { valid: true, document: payload };
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default {
  // Explicit Env type reference above; using loosely typed env to avoid missing symbol in unit TS context.
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const baseHeaders: HeadersInit = { "x-request-id": requestId };
    const docsStore = getDocsStore(env);

    if (url.pathname === "/health" || url.pathname === "/healthz") {
      return json(
        { status: "ok", service: "documentation-worker", requestId },
        { status: 200, headers: baseHeaders },
      );
    }

    // Root — redirect to /docs
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(new URL("/docs", request.url).toString(), 302);
    }

    if (request.method === "GET" && (url.pathname === "/docs" || url.pathname === "/docs/index")) {
      const persisted = docsStore ? await docsStore.get(DOCS_KEY, "json") : null;
      const document = isPlainObject(persisted) ? persisted : {};
      return json(document, { status: 200, headers: baseHeaders });
    }

    if (request.method === "PUT" && url.pathname === "/docs") {
      if (!docsStore) {
        return json(
          { error: "Docs storage is not configured", requestId },
          { status: 500, headers: baseHeaders },
        );
      }

      const contentLength = request.headers.get("content-length");
      if (contentLength && Number(contentLength) > MAX_DOCS_BYTES) {
        return json(
          { error: "Payload too large", requestId },
          { status: 400, headers: baseHeaders },
        );
      }

      const bodyText = await request.text();
      const parsed = parseAndValidateDocument(bodyText);
      if (!parsed.valid) {
        return json({ error: parsed.error, requestId }, { status: 400, headers: baseHeaders });
      }

      await docsStore.put(DOCS_KEY, JSON.stringify(parsed.document));
      return json({ ok: true, requestId }, { status: 200, headers: baseHeaders });
    }

    return json(
      { error: "Not Found", path: url.pathname, requestId },
      { status: 404, headers: baseHeaders },
    );
  },
} satisfies ExportedHandler<Env>;
