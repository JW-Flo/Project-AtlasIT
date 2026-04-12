/**
 * Request body size limit enforcement.
 *
 * Exported as a standalone module so the logic can be unit-tested directly
 * without going through the SvelteKit hook infrastructure.
 *
 * Mitigates the BODY_SIZE_LIMIT bypass attack described in the
 * @sveltejs/adapter-node security advisory: beyond checking the
 * (spoofable) Content-Length header, the function streams the actual
 * bytes and aborts as soon as the limit is exceeded.
 */

/** HTTP methods that may carry a request body and should be size-checked. */
export const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Returns a 413 Payload Too Large JSON response. */
export function payloadTooLargeResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Payload too large", code: "payload_too_large" }),
    { status: 413, headers: { "content-type": "application/json" } },
  );
}

/**
 * Parses the BODY_SIZE_LIMIT environment variable.
 *
 * Rules:
 * - Missing / non-numeric  → use `defaultLimit`
 * - 0 or negative          → Infinity (limit disabled)
 * - Positive integer        → that many bytes
 */
export function parseBodySizeLimit(
  rawEnvValue: string | undefined,
  defaultLimit: number,
): number {
  if (!rawEnvValue) return defaultLimit;
  const parsed = parseInt(rawEnvValue, 10);
  if (!Number.isFinite(parsed)) return defaultLimit;
  if (parsed <= 0) return Infinity; // 0 explicitly disables the limit
  return parsed;
}

export type BodyCheckResult =
  | { blocked: true; response: Response }
  | { blocked: false; request: Request };

/**
 * Enforces a maximum request body size.
 *
 * Returns `{ blocked: true, response }` with a 413 when the body exceeds
 * `limitBytes`, or `{ blocked: false, request }` with a reconstructed
 * Request (body pre-read into a buffer) when within the limit.
 *
 * @param request   The incoming Request to check.
 * @param limitBytes Maximum allowed body size in bytes.  Pass `Infinity`
 *                   to skip the limit (still reassembles the body).
 */
export async function checkBodySizeLimit(
  request: Request,
  limitBytes: number,
): Promise<BodyCheckResult> {
  if (!BODY_METHODS.has(request.method) || !request.body) {
    return { blocked: false, request };
  }

  // Fast path: reject based on the declared Content-Length header.
  const clHeader = parseInt(request.headers.get("content-length") ?? "", 10);
  if (!isNaN(clHeader) && clHeader > limitBytes) {
    return { blocked: true, response: payloadTooLargeResponse() };
  }

  // Streaming path: count actual bytes to prevent Content-Length spoofing.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let oversized = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limitBytes) {
        oversized = true;
        await reader.cancel().catch(() => undefined);
        break;
      }
      chunks.push(value);
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "warn",
        event: "security:body-size-limit.stream-error",
        message: "Body stream read error during size check",
        err: String(err),
      }),
    );
    // Stream errors are non-fatal here; forward the (potentially partial)
    // request to the route handler so it can surface a proper error.
  }

  if (oversized) {
    return { blocked: true, response: payloadTooLargeResponse() };
  }

  // Reassemble the consumed chunks so downstream handlers can still read the body.
  const assembled = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    assembled.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { blocked: false, request: new Request(request, { body: assembled }) };
}
