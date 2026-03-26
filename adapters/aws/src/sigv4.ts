/**
 * Lightweight SigV4 signing helper for Cloudflare Workers.
 *
 * Wraps the lower-level signing primitives in signing.ts with a simpler
 * function signature for ad-hoc request signing in evidence collection.
 */

import { signRequest } from "./signing.js";

/**
 * Sign an AWS request and return the headers needed to authenticate it.
 *
 * Returns an object with Authorization, x-amz-date, host, and
 * x-amz-content-sha256 headers.
 */
export async function signAwsRequest(
  method: string,
  url: string,
  service: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  body = "",
): Promise<Record<string, string>> {
  return signRequest({
    method,
    url,
    headers: {},
    body,
    accessKeyId,
    secretAccessKey,
    region,
    service,
  });
}
